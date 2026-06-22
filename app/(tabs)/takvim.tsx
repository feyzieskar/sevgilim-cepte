// ====================================================================
// TAKVİM SEKMESİ (iskelet)
// ====================================================================
// Sonraki adımda eklenecekler:
//  - react-native-calendars ile aylık görünüm
//  - Etkinlik / hatırlatıcı ekleme, renkli kategoriler
//  - "Bize Özel Günler" otomatik listesi
//  - expo-calendar ile Apple Takvim'e aktarma
// ====================================================================

import { YakindaEkran } from "@/components/ui/YakindaEkran";

export default function TakvimEkrani() {
  return (
    <YakindaEkran
      baslik="Takvim"
      altBaslik="Ortak planlarımız"
      ikon="calendar"
      aciklama="Aylık takvim, etkinlikler ve özel günler"
    />
  );
}
