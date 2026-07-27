// ====================================================================
// Edge Function: send-push
// ====================================================================
// Partnere Expo Push bildirimi gönderir.
// Girdi: { toUserId, title, body, data? }
//
// Güvenlik:
//  - JWT zorunlu (verify_jwt)
//  - Çağıran yalnızca kendi partner'ına gönderebilir
//  - Push token service_role ile okunur
// ====================================================================

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PushIstek {
  toUserId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonYanit({ error: "Yetkisiz" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Çağıran kullanıcıyı JWT ile doğrula
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return jsonYanit({ error: "Yetkisiz" }, 401);
    }

    const govde = (await req.json()) as PushIstek;
    const { toUserId, title, body, data } = govde;

    if (!toUserId || !title || !body) {
      return jsonYanit(
        { error: "toUserId, title ve body zorunlu" },
        400
      );
    }

    // Service role: profil / token okuma (RLS bypass)
    const admin = createClient(supabaseUrl, serviceKey);

    // Partner doğrulaması (çift yönlü)
    const { data: cagiranProfil } = await admin
      .from("profiles")
      .select("partner_id")
      .eq("id", user.id)
      .maybeSingle();

    let partnerMi = cagiranProfil?.partner_id === toUserId;

    if (!partnerMi) {
      const { data: tersProfil } = await admin
        .from("profiles")
        .select("id")
        .eq("id", toUserId)
        .eq("partner_id", user.id)
        .maybeSingle();
      partnerMi = !!tersProfil;
    }

    if (!partnerMi) {
      return jsonYanit({ error: "Yalnızca partner'a bildirim gönderilebilir" }, 403);
    }

    // Hedef kullanıcının Expo Push Token'ını oku
    const { data: hedef, error: hedefHata } = await admin
      .from("profiles")
      .select("expo_push_token")
      .eq("id", toUserId)
      .maybeSingle();

    if (hedefHata) {
      return jsonYanit({ error: hedefHata.message }, 500);
    }

    const token = hedef?.expo_push_token as string | null | undefined;
    if (!token) {
      return jsonYanit({ error: "Partner'ın push token'ı yok" }, 404);
    }

    // Expo Push API'ye gönder
    const expoYanit = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: token,
        sound: "default",
        title,
        body,
        data: data ?? {},
      }),
    });

    const expoSonuc = await expoYanit.json();

    if (!expoYanit.ok) {
      return jsonYanit(
        { error: "Expo Push API hatası", detail: expoSonuc },
        502
      );
    }

    return jsonYanit({ ok: true, result: expoSonuc }, 200);
  } catch (e) {
    const mesaj = e instanceof Error ? e.message : String(e);
    return jsonYanit({ error: mesaj }, 500);
  }
});

function jsonYanit(govde: unknown, status: number): Response {
  return new Response(JSON.stringify(govde), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
