// ====================================================================
// FEYZİ SERVİSİ (OpenAI GPT-4o)
// ====================================================================
// Sohbet geçmişi + seçili modun system prompt'u + yeni mesajı OpenAI
// Chat Completions API'ye gönderir ve Feyzi'nin cevabını döndürür.
// (openai SDK yerine doğrudan fetch kullanılır; React Native'de daha
//  sorunsuz çalışır ve ekstra bağımlılık gerektirmez.)
// ====================================================================

import { FeyziMode, feyziSystemPrompt } from "@/constants/feyziPrompts";
import { getOpenAiKey } from "@/services/apiKeys";

const API_URL = "https://api.openai.com/v1/chat/completions";

// Tek bir sohbet mesajının API'ye gönderilecek sade hali
export interface SohbetMesaji {
  role: "user" | "assistant";
  content: string;
}

// Servis hatalarını ayırt edebilmek için özel hata kodları
export type FeyziHataKodu = "NO_KEY" | "API" | "AG"; // AG = ağ/bağlantı

export class FeyziError extends Error {
  kod: FeyziHataKodu;
  constructor(kod: FeyziHataKodu, mesaj: string) {
    super(mesaj);
    this.kod = kod;
  }
}

// Feyzi'ye soru sorar; cevabı metin olarak döndürür.
export async function feyziyeSor(
  gecmis: SohbetMesaji[],
  mod: FeyziMode,
  anilarMetni?: string
): Promise<string> {
  const key = await getOpenAiKey();
  if (!key) {
    throw new FeyziError("NO_KEY", "OpenAI API anahtarı bulunamadı.");
  }

  const sistem = feyziSystemPrompt(mod, anilarMetni);

  const apiMesajlari = [
    { role: "system" as const, content: sistem },
    ...gecmis.map((m) => ({ role: m.role, content: m.content })),
  ];

  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: apiMesajlari,
        temperature: 0.8,
        max_tokens: 500,
      }),
    });
  } catch {
    // Ağ hatası (internet yok vb.)
    throw new FeyziError("AG", "Bağlantı kurulamadı.");
  }

  if (!res.ok) {
    throw new FeyziError("API", `OpenAI hatası: ${res.status}`);
  }

  const veri = await res.json();
  const cevap: string | undefined = veri?.choices?.[0]?.message?.content;
  if (!cevap) {
    throw new FeyziError("API", "Boş cevap döndü.");
  }
  return cevap.trim();
}
