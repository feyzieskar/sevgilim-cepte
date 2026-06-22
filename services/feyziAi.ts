// ====================================================================
// FEYZİ AI SERVİSİ (placeholder / 2. faz)
// ====================================================================
// Bu dosya, OpenAI GPT-4o entegrasyonu için iskelet niteliğindedir.
// Sohbet ekranı (app/(tabs)/feyzi-ai.tsx) sonraki adımda buradaki
// fonksiyonları kullanacak. Şimdilik gerçek API çağrısı YOK.
//
// API anahtarları .env (EXPO_PUBLIC_OPENAI_API_KEY) veya daha güvenli
// olarak expo-secure-store üzerinden okunacaktır.
// ====================================================================

// Sohbet modları (her biri farklı bir system prompt kullanır)
export type FeyziModu = "normal" | "moral" | "plan" | "ani" | "sesli" | "video";

// ---------------------------------------------------------------
// FEYZİ KİŞİLİĞİ — SYSTEM PROMPT (PLACEHOLDER)
// ---------------------------------------------------------------
// >>> BURAYI SEN DOLDURACAKSIN <<<
// Feyzi'nin nasıl konuştuğunu, tarzını, hitap şeklini, sevdiği
// kelimeleri, geçmişinizi vb. buraya yazacaksın.
export const FEYZI_KISILIK_PROMPT = `
[FEYZİ KİŞİLİĞİ BURAYA YAZILACAK]
Örnek: "Sen Feyzi'sin. Sevgi dolu, esprili ve şefkatli konuşursun..."
`;

// Her moda özel ek talimatlar (system prompt'a eklenir)
export const MOD_PROMPTLARI: Record<FeyziModu, string> = {
  normal: "Feyzi'nin normal, samimi sohbet tarzında yanıt ver.",
  moral: "Destekleyici, şefkatli ve moral verici bir ton kullan. Yargılama, sadece sıcacık ol.",
  plan: "Bir hafta sonu veya date planı öner. Somut, uygulanabilir ve romantik fikirler ver.",
  ani: "Kayıtlı anılardan bahsederek konuş. Sana verilen anı bağlamını kullan.",
  sesli: "Kısa ve doğal cümleler kur; cevap sesli okunacak.",
  video: "Kısa, sıcak ve yüz yüze konuşur gibi yanıt ver; cevap konuşan video olacak.",
};

// Verilen moda göre tam system prompt'u oluşturur.
export function systemPromptOlustur(mod: FeyziModu, aniBaglami?: string): string {
  const temel = `${FEYZI_KISILIK_PROMPT}\n\n${MOD_PROMPTLARI[mod]}`;
  if (mod === "ani" && aniBaglami) {
    return `${temel}\n\nİlgili anılar:\n${aniBaglami}`;
  }
  return temel;
}

// TODO (2. faz): OpenAI çağrısı
// export async function feyziyeSor(mesajlar, mod) { ... }
