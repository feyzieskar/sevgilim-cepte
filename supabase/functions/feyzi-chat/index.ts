// ====================================================================
// Edge Function: feyzi-chat
// ====================================================================
// OpenAI GPT-4o isteklerini sunucu tarafında proxy eder.
// API anahtarı yalnızca bu fonksiyonun ortam değişkenlerinde bulunur;
// istemci uygulamaya hiçbir zaman gönderilmez.
//
// Güvenlik:
//  - JWT zorunlu (Authorization header → supabase.auth.getUser)
//  - Model sunucu tarafında sabitlenmiş (gpt-4o)
//  - max_tokens sunucu tarafında sınırlı
//  - İstek gövdesi doğrulanır (mesaj sayısı, boyut)
//  - Hata mesajlarında API anahtarı veya dahili bilgi bulunmaz
// ====================================================================

import { createClient } from "npm:@supabase/supabase-js@2";

// --- Yapılandırma sabitleri ---
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o";
const MAX_TOKENS = 600;
const TEMPERATURE = 0.8;
const MAX_MESSAGES = 60;
const MAX_BODY_BYTES = 64_000; // ~64 KB istek gövdesi sınırı
const MAX_TOOL_DEFS = 20;

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// --- Tip tanımları ---
interface ChatMessage {
  role: string;
  content: string | null;
  tool_calls?: unknown[];
  tool_call_id?: string;
}

interface ToolDef {
  type: string;
  function: {
    name: string;
    description?: string;
    parameters?: unknown;
  };
}

interface ChatRequest {
  messages: ChatMessage[];
  tools?: ToolDef[];
  tool_choice?: string;
}

// --- Yardımcılar ---
function jsonYanit(govde: unknown, status: number): Response {
  return new Response(JSON.stringify(govde), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function hataYanit(mesaj: string, status: number): Response {
  return jsonYanit({ error: mesaj }, status);
}

// --- Ana işleyici ---
Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1) JWT doğrulama
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return hataYanit("Yetkisiz", 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !anonKey) {
      return hataYanit("Sunucu yapılandırma hatası", 500);
    }

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return hataYanit("Yetkisiz", 401);
    }

    // 2) OpenAI API anahtarı kontrolü
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return hataYanit("AI servisi şu anda kullanılamıyor", 503);
    }

    // 3) İstek gövdesi doğrulama
    const rawBody = await req.text();
    if (rawBody.length > MAX_BODY_BYTES) {
      return hataYanit("İstek gövdesi çok büyük", 413);
    }

    let govde: ChatRequest;
    try {
      govde = JSON.parse(rawBody) as ChatRequest;
    } catch {
      return hataYanit("Geçersiz JSON", 400);
    }

    if (!Array.isArray(govde.messages) || govde.messages.length === 0) {
      return hataYanit("messages dizisi zorunlu", 400);
    }

    if (govde.messages.length > MAX_MESSAGES) {
      return hataYanit(`En fazla ${MAX_MESSAGES} mesaj gönderilebilir`, 400);
    }

    // Tools doğrulama (varsa)
    if (govde.tools && !Array.isArray(govde.tools)) {
      return hataYanit("tools bir dizi olmalı", 400);
    }

    if (govde.tools && govde.tools.length > MAX_TOOL_DEFS) {
      return hataYanit(`En fazla ${MAX_TOOL_DEFS} araç tanımlanabilir`, 400);
    }

    // 4) OpenAI'ye istek gönder
    // Model ve max_tokens sunucu tarafında sabitlenir — istemci geçersiz kılamaz
    const openaiBody = {
      model: MODEL,
      messages: govde.messages,
      tools: govde.tools ?? undefined,
      tool_choice: govde.tools ? (govde.tool_choice ?? "auto") : undefined,
      temperature: TEMPERATURE,
      max_tokens: MAX_TOKENS,
    };

    let openaiRes: Response;
    try {
      openaiRes = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify(openaiBody),
      });
    } catch {
      return hataYanit("AI servisine bağlanılamadı", 502);
    }

    if (!openaiRes.ok) {
      // Hata detaylarını loglamadan genel mesaj döndür
      const status = openaiRes.status;
      if (status === 429) {
        return hataYanit("AI servisi şu anda meşgul, lütfen tekrar deneyin", 429);
      }
      return hataYanit(`AI servisi hatası (${status})`, 502);
    }

    // 5) OpenAI yanıtını istemciye ilet
    const openaiData = await openaiRes.json();
    return jsonYanit(openaiData, 200);
  } catch (e) {
    // Dahili hataları logla ama istemciye detay verme
    console.error("[feyzi-chat] Beklenmeyen hata:", e instanceof Error ? e.message : e);
    return hataYanit("Beklenmeyen sunucu hatası", 500);
  }
});
