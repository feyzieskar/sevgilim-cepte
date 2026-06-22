// ====================================================================
// ANILAR SEKMESİ (iskelet)
// ====================================================================
// Sonraki adımda eklenecekler:
//  - Fotoğraf + tarih + not ile anı ekleme (expo-image-picker)
//  - Zaman tüneli (timeline) görünümü
//  - "Bu gün ne olmuştu?" eşleşmeleri
//  - Favori anılar, harita görünümü (react-native-maps), gizli notlar
// ====================================================================

import { YakindaEkran } from "@/components/ui/YakindaEkran";

export default function AnilarEkrani() {
  return (
    <YakindaEkran
      baslik="Anılar"
      altBaslik="Birlikte yarattığımız anlar"
      ikon="images"
      aciklama="Fotoğraflar, zaman tüneli ve haritada anılarımız"
    />
  );
}
