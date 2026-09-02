// ====================================================================
// FEYZİ SERVİSİ (Supabase Edge Function → OpenAI GPT-4o + Function Calling)
// ====================================================================
// Sohbet + tools: Feyzi takvim/özel gün/sebep ekleyebilir, anı hatırlatır,
// en yakın özel günü söyler. Kalıcı yazma işlemleri onay bekler.
//
// GÜVENLİK: OpenAI istekleri Supabase Edge Function üzerinden yapılır.
// API anahtarı istemci uygulamada bulunmaz; yalnızca sunucu tarafındadır.
// ====================================================================

import { EventCategory } from "@/constants/kategoriler";
import { FeyziMode, feyziSystemPrompt } from "@/constants/feyziPrompts";
import { bugunISO, tarihKisa, tarihUzun } from "@/constants/tarih";
import { enYakinOzelGun } from "@/data/ozelGunler";
import { supabase } from "@/lib/supabase";
import { isValidDate, isValidTime, clampString } from "@/lib/validation";
import { useCalendarStore } from "@/store/calendarStore";
import { useLoveReasonStore } from "@/store/loveReasonStore";
import { useMemoryStore } from "@/store/memoryStore";
import { useOzelGunStore } from "@/store/ozelGunStore";

const MAX_TOOL_DONGUSU = 4;

// --- API mesaj tipleri ---
export interface SohbetMesaji {
  role: "user" | "assistant";
  content: string;
}

type ApiRole = "system" | "user" | "assistant" | "tool";

interface ApiMesaj {
  role: ApiRole;
  content: string | null;
  tool_calls?: ApiToolCall[];
  tool_call_id?: string;
}

interface ApiToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

// Yazma araçları — kullanıcı onayı gerekir
const YAZMA_ARACLARI = new Set(["takvimeEtkinlikEkle", "ozelGunEkle", "sevmeSebebiEkle"]);

export type BilgiKarti = {
  metin: string; // örn. "✅ Takvime eklendi"
};

export type BekleyenOnay = {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  ozet: string; // onay kartında gösterilecek özet
  // Onay sonrası OpenAI'ye devam etmek için bağlam
  apiMesajlari: ApiMesaj[];
};

export type FeyziYanit =
  { tur: "cevap"; metin: string; bilgiler?: BilgiKarti[] } | { tur: "onay"; onay: BekleyenOnay };

export type FeyziHataKodu = "NO_KEY" | "API" | "AG";

export class FeyziError extends Error {
  kod: FeyziHataKodu;
  constructor(kod: FeyziHataKodu, mesaj: string) {
    super(mesaj);
    this.kod = kod;
  }
}

// OpenAI tools tanımları
const FEYZI_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "takvimeEtkinlikEkle",
      description:
        "Takvime yeni bir etkinlik/plan ekler. Kullanıcı plan, buluşma, sinema vb. eklemek istediğinde kullan.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Etkinlik başlığı" },
          date: {
            type: "string",
            description: "Tarih YYYY-MM-DD (yarın/cuma vb. gerçek tarihe çevrilmiş)",
          },
          time: {
            type: "string",
            description: "Saat HH:mm (opsiyonel)",
          },
          category: {
            type: "string",
            enum: ["tatil", "bulusma", "ozel_gun", "is_okul"],
            description: "Kategori",
          },
          note: { type: "string", description: "Not (opsiyonel)" },
        },
        required: ["title", "date", "category"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "ozelGunEkle",
      description: "Yılda bir tekrar eden özel gün ekler (doğum günü, yıldönümü vb.).",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Özel gün adı" },
          emoji: { type: "string", description: "Emoji (ör. 🎂)" },
          gun: { type: "integer", description: "Ayın günü (1-31)" },
          ay: { type: "integer", description: "Ay (1-12)" },
        },
        required: ["title", "emoji", "gun", "ay"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "sevmeSebebiEkle",
      description: "Sevgiline özel bir 'seni sevme sebebim' metni ekler.",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string", description: "Sevme sebebi metni" },
        },
        required: ["text"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "aniHatirlat",
      description:
        "Kayıtlı anılardan birini getirip özetler. Tarih verilmezse bugünün gün/ayı için arar; yoksa rastgele bir anı seçer.",
      parameters: {
        type: "object",
        properties: {
          tarih: {
            type: "string",
            description: "Opsiyonel YYYY-MM-DD; gün+ay eşleşmesi aranır",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "sonrakiOzelGun",
      description: "En yakın özel güne kalan gün sayısını ve bilgisini döndürür.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
];

// Kategori etiketi (özet için)
function kategoriEtiket(cat: string): string {
  const map: Record<string, string> = {
    tatil: "Tatil",
    bulusma: "Buluşma",
    ozel_gun: "Özel Gün",
    is_okul: "İş / Okul",
  };
  return map[cat] ?? cat;
}

/** Onay kartında gösterilecek Türkçe özet */
export function aracOzeti(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case "takvimeEtkinlikEkle": {
      const title = clampString(String(args.title ?? ""), 100);
      const date = String(args.date ?? "");
      const time = args.time ? ` ${args.time}` : "";
      const cat = kategoriEtiket(String(args.category ?? "bulusma"));
      return `Takvime ekle: "${title}" — ${date}${time} (${cat})`;
    }
    case "ozelGunEkle": {
      const title = clampString(String(args.title ?? ""), 100);
      const emoji = String(args.emoji ?? "💕");
      const gun = Number(args.gun);
      const ay = Number(args.ay);
      return `Özel gün ekle: ${emoji} ${title} (${gun}.${ay})`;
    }
    case "sevmeSebebiEkle":
      return `Sevme sebebi ekle: "${clampString(String(args.text ?? ""), 80)}"`;
    default:
      return name;
  }
}

/** Bilgi kartı metni (başarılı işlem sonrası) */
export function aracBasariMetni(name: string): string {
  switch (name) {
    case "takvimeEtkinlikEkle":
      return "✅ Takvime eklendi";
    case "ozelGunEkle":
      return "✅ Özel gün eklendi";
    case "sevmeSebebiEkle":
      return "✅ Sevme sebebi eklendi";
    default:
      return "✅ Tamamlandı";
  }
}

// --- Araç uygulamaları ---

async function calistirTakvim(args: Record<string, unknown>): Promise<string> {
  const title = clampString(String(args.title ?? "").trim(), 200);
  const date = String(args.date ?? "").trim();
  const time = args.time ? String(args.time).trim() : undefined;
  const category = String(args.category ?? "bulusma") as EventCategory;
  const note = args.note ? clampString(String(args.note).trim(), 500) : undefined;

  if (!title || !date) {
    return JSON.stringify({ ok: false, hata: "Başlık ve tarih zorunlu." });
  }

  if (!isValidDate(date)) {
    return JSON.stringify({ ok: false, hata: `Geçersiz tarih: ${date}` });
  }

  if (time && !isValidTime(time)) {
    return JSON.stringify({ ok: false, hata: `Geçersiz saat formatı: ${time}` });
  }

  const gecerli: EventCategory[] = ["tatil", "bulusma", "ozel_gun", "is_okul"];
  const cat = gecerli.includes(category) ? category : "bulusma";

  const yeni = await useCalendarStore.getState().addEvent({
    title,
    date,
    time,
    category: cat,
    note,
    hasReminder: false,
  });

  if (!yeni) {
    return JSON.stringify({ ok: false, hata: "Etkinlik kaydedilemedi." });
  }
  return JSON.stringify({
    ok: true,
    id: yeni.id,
    title: yeni.title,
    date: yeni.date,
    time: yeni.time ?? null,
    category: yeni.category,
  });
}

async function calistirOzelGun(args: Record<string, unknown>): Promise<string> {
  const title = clampString(String(args.title ?? "").trim(), 200);
  const emoji = clampString(String(args.emoji ?? "💕").trim(), 10) || "💕";
  const gun = Number(args.gun);
  const ay = Number(args.ay);

  if (!title || !gun || !ay || gun < 1 || gun > 31 || ay < 1 || ay > 12) {
    return JSON.stringify({ ok: false, hata: "Geçersiz özel gün bilgisi." });
  }

  // Ay-gün kombinasyonu geçerliliği (ör. 31 Şubat engelle)
  const testDate = new Date(2024, ay - 1, gun); // 2024 artık yıl
  if (testDate.getMonth() !== ay - 1 || testDate.getDate() !== gun) {
    return JSON.stringify({ ok: false, hata: `Geçersiz gün/ay kombinasyonu: ${gun}.${ay}` });
  }

  const yeni = await useOzelGunStore.getState().addOzelGun({
    baslik: title,
    emoji,
    gun,
    ay,
  });

  if (!yeni) {
    return JSON.stringify({ ok: false, hata: "Özel gün kaydedilemedi." });
  }
  return JSON.stringify({
    ok: true,
    id: yeni.id,
    baslik: yeni.baslik,
    emoji: yeni.emoji,
    gun: yeni.gun,
    ay: yeni.ay,
  });
}

async function calistirSevmeSebebi(args: Record<string, unknown>): Promise<string> {
  const text = clampString(String(args.text ?? "").trim(), 500);
  if (!text) {
    return JSON.stringify({ ok: false, hata: "Sebep metni boş olamaz." });
  }

  const yeni = await useLoveReasonStore.getState().addReason(text);
  if (!yeni) {
    return JSON.stringify({ ok: false, hata: "Sebep kaydedilemedi." });
  }
  return JSON.stringify({ ok: true, id: yeni.id, text: yeni.text });
}

function calistirAniHatirlat(args: Record<string, unknown>): string {
  const store = useMemoryStore.getState();
  let anilar = store.memories;

  if (args.tarih) {
    const iso = String(args.tarih);
    if (isValidDate(iso)) {
      const [, mo, g] = iso.split("-").map(Number);
      if (mo && g) {
        const hedef = new Date(2000, mo - 1, g);
        anilar = store.getMemoriesByDate(hedef);
      }
    }
  }

  if (anilar.length === 0 && !args.tarih) {
    // Rastgele bir anı
    anilar = store.memories;
  }

  if (anilar.length === 0) {
    return JSON.stringify({
      ok: true,
      bulundu: false,
      ozet: "Henüz kayıtlı anı yok.",
    });
  }

  // Favoriler öncelikli, yoksa en yeni
  const favoriler = anilar.filter((m) => m.isFavorite);
  const secilen =
    favoriler[Math.floor(Math.random() * favoriler.length)] ??
    anilar[Math.floor(Math.random() * anilar.length)];

  const yer = secilen.locationName ? ` (${secilen.locationName})` : "";
  const not = secilen.note || "(notsuz anı)";
  const ozet = `${tarihKisa(secilen.date)}${yer}: ${not}`;

  return JSON.stringify({
    ok: true,
    bulundu: true,
    tarih: secilen.date,
    ozet,
    favori: secilen.isFavorite,
  });
}

function calistirSonrakiOzelGun(): string {
  const liste = useOzelGunStore.getState().ozelGunler;
  const yakin = enYakinOzelGun(liste);

  if (!yakin) {
    return JSON.stringify({
      ok: true,
      bulundu: false,
      ozet: "Kayıtlı özel gün yok.",
    });
  }

  return JSON.stringify({
    ok: true,
    bulundu: true,
    baslik: yakin.gun.baslik,
    emoji: yakin.gun.emoji,
    kalanGun: yakin.kalan,
    tarih: bugunISO(yakin.tarih),
    ozet: `${yakin.gun.emoji} ${yakin.gun.baslik} — ${yakin.kalan} gün kaldı`,
  });
}

/** Onaysız (okuma) araçları hemen çalıştırır */
function calistirOkumaAraci(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case "aniHatirlat":
      return calistirAniHatirlat(args);
    case "sonrakiOzelGun":
      return calistirSonrakiOzelGun();
    default:
      return JSON.stringify({ ok: false, hata: `Bilinmeyen araç: ${name}` });
  }
}

/** Onaylanmış yazma aracını çalıştırır */
export async function yazmaAraciniUygula(
  name: string,
  args: Record<string, unknown>
): Promise<{ sonuc: string; bilgi?: BilgiKarti }> {
  let sonuc: string;
  switch (name) {
    case "takvimeEtkinlikEkle":
      sonuc = await calistirTakvim(args);
      break;
    case "ozelGunEkle":
      sonuc = await calistirOzelGun(args);
      break;
    case "sevmeSebebiEkle":
      sonuc = await calistirSevmeSebebi(args);
      break;
    default:
      sonuc = JSON.stringify({ ok: false, hata: `Bilinmeyen yazma aracı: ${name}` });
  }

  let bilgi: BilgiKarti | undefined;
  try {
    const parsed = JSON.parse(sonuc) as { ok?: boolean };
    if (parsed.ok) bilgi = { metin: aracBasariMetni(name) };
  } catch {
    // yok say
  }
  return { sonuc, bilgi };
}

/**
 * OpenAI'ye Edge Function üzerinden istek gönderir.
 * API anahtarı sunucu tarafında kalır; istemcide bulunmaz.
 */
async function openaiCagir(apiMesajlari: ApiMesaj[]): Promise<{
  message: {
    role: string;
    content: string | null;
    tool_calls?: ApiToolCall[];
  };
}> {
  const { data, error } = await supabase.functions.invoke("feyzi-chat", {
    body: {
      messages: apiMesajlari,
      tools: FEYZI_TOOLS,
      tool_choice: "auto",
    },
  });

  if (error) {
    throw new FeyziError("API", "AI servisine bağlanılamadı.");
  }

  // Edge Function hata döndüyse
  if (data?.error) {
    throw new FeyziError("API", data.error as string);
  }

  const message = data?.choices?.[0]?.message;
  if (!message) {
    throw new FeyziError("API", "Boş cevap döndü.");
  }
  return { message };
}

/**
 * Tool döngüsü: okuma araçlarını uygular; yazma aracında onay için durur.
 */
async function toolDongusu(
  apiMesajlari: ApiMesaj[],
  bilgiler: BilgiKarti[] = []
): Promise<FeyziYanit> {
  for (let i = 0; i < MAX_TOOL_DONGUSU; i++) {
    const { message } = await openaiCagir(apiMesajlari);

    const toolCalls = message.tool_calls;
    if (!toolCalls || toolCalls.length === 0) {
      const metin = (message.content ?? "").trim();
      if (!metin) throw new FeyziError("API", "Boş cevap döndü.");
      return {
        tur: "cevap",
        metin,
        bilgiler: bilgiler.length > 0 ? bilgiler : undefined,
      };
    }

    // Assistant tool_calls mesajını bağlama ekle
    apiMesajlari.push({
      role: "assistant",
      content: message.content ?? null,
      tool_calls: toolCalls,
    });

    const okumalar = toolCalls.filter((t) => !YAZMA_ARACLARI.has(t.function.name));
    const yazmalar = toolCalls.filter((t) => YAZMA_ARACLARI.has(t.function.name));

    // Okuma araçlarını hemen çalıştır
    for (const tc of okumalar) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(tc.function.arguments || "{}") as Record<string, unknown>;
      } catch {
        args = {};
      }
      const sonuc = calistirOkumaAraci(tc.function.name, args);
      apiMesajlari.push({
        role: "tool",
        tool_call_id: tc.id,
        content: sonuc,
      });
    }

    // Fazla yazma çağrılarını reddet (tek onay kartı)
    if (yazmalar.length > 1) {
      for (const ekstra of yazmalar.slice(1)) {
        apiMesajlari.push({
          role: "tool",
          tool_call_id: ekstra.id,
          content: JSON.stringify({
            ok: false,
            hata: "Bir seferde yalnızca bir yazma işlemi yapılabilir.",
          }),
        });
      }
    }

    // Yazma aracı varsa onay bekle
    if (yazmalar.length > 0) {
      const yazma = yazmalar[0];
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(yazma.function.arguments || "{}") as Record<string, unknown>;
      } catch {
        args = {};
      }
      return {
        tur: "onay",
        onay: {
          toolCallId: yazma.id,
          toolName: yazma.function.name,
          args,
          ozet: aracOzeti(yazma.function.name, args),
          apiMesajlari: [...apiMesajlari],
        },
      };
    }

    // Yalnızca okuma vardı → döngü devam (OpenAI doğal cevap üretecek)
  }

  throw new FeyziError("API", "Çok fazla araç çağrısı.");
}

/** İlk mesaj: kullanıcı sohbeti + tools */
export async function feyziyeSor(
  gecmis: SohbetMesaji[],
  mod: FeyziMode,
  anilarMetni?: string
): Promise<FeyziYanit> {
  const bugun = new Date();
  const bugunMetin = `${bugunISO(bugun)} (${tarihUzun(bugunISO(bugun))})`;
  const sistem = feyziSystemPrompt(mod, anilarMetni, bugunMetin);

  const apiMesajlari: ApiMesaj[] = [
    { role: "system", content: sistem },
    ...gecmis.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  return toolDongusu(apiMesajlari);
}

/**
 * Kullanıcı onayladıktan sonra yazma aracını uygular ve Feyzi'nin
 * doğal cevabını alır.
 */
export async function onaySonrasiDevam(onay: BekleyenOnay): Promise<FeyziYanit> {
  const { sonuc, bilgi } = await yazmaAraciniUygula(onay.toolName, onay.args);
  const bilgiler: BilgiKarti[] = bilgi ? [bilgi] : [];

  const apiMesajlari: ApiMesaj[] = [
    ...onay.apiMesajlari,
    {
      role: "tool",
      tool_call_id: onay.toolCallId,
      content: sonuc,
    },
  ];

  // Aynı assistant turunda başka tool_calls varsa (nadir) — yalnızca
  // onaylananı yanıtladık; OpenAI devam eder.
  return toolDongusu(apiMesajlari, bilgiler);
}

/** Kullanıcı reddetti — modele bildir, nazik cevap al */
export async function onayReddiDevam(onay: BekleyenOnay): Promise<FeyziYanit> {
  const apiMesajlari: ApiMesaj[] = [
    ...onay.apiMesajlari,
    {
      role: "tool",
      tool_call_id: onay.toolCallId,
      content: JSON.stringify({
        ok: false,
        iptal: true,
        mesaj: "Kullanıcı işlemi onaylamadı.",
      }),
    },
  ];
  return toolDongusu(apiMesajlari);
}

/** Geriye dönük uyumluluk: sadece metin isteyen yerler için */
export async function feyziyeSorMetin(
  gecmis: SohbetMesaji[],
  mod: FeyziMode,
  anilarMetni?: string
): Promise<string> {
  const yanit = await feyziyeSor(gecmis, mod, anilarMetni);
  if (yanit.tur === "cevap") return yanit.metin;
  return yanit.onay.ozet;
}
