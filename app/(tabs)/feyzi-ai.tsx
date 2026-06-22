// ====================================================================
// FEYZİ AI SEKMESİ (iskelet)
// ====================================================================
// Sonraki adımda eklenecekler:
//  - OpenAI GPT-4o ile sohbet (mesaj balonları)
//  - Mod seçici: Normal / Moral / Plan / Anı / Sesli / Video
//  - ElevenLabs (TTS) ve D-ID (konuşan video) entegrasyonu
//  - API anahtarları: .env + expo-secure-store
// ====================================================================

import { YakindaEkran } from "@/components/ui/YakindaEkran";

export default function FeyziAiEkrani() {
  return (
    <YakindaEkran
      baslik="Feyzi AI"
      altBaslik="Benimle her zaman konuşabilirsin"
      ikon="chatbubbles"
      aciklama="Feyzi ile sohbet: normal, moral, plan ve anı modları"
    />
  );
}
