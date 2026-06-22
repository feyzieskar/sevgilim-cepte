// ====================================================================
// SÜRPRİZLER SEKMESİ (iskelet)
// ====================================================================
// Sonraki adımda eklenecekler:
//  - Kilitli mesaj/hediye kartları (bulanık + kilit ikonu)
//  - Açılma koşulları: belirli tarih / "kötü hissettiğinde" /
//    "beni özlediğinde" / "tatile 3 gün kala"
//  - Koşul sağlanınca animasyonla açılma
//  - Admin ekleme: metin/fotoğraf + açılma koşulu
// ====================================================================

import { YakindaEkran } from "@/components/ui/YakindaEkran";

export default function SurprizlerEkrani() {
  return (
    <YakindaEkran
      baslik="Sürprizler"
      altBaslik="Sana özel sakladıklarım"
      ikon="gift"
      aciklama="Kilitli sürpriz kutuları, doğru zaman gelince açılır"
    />
  );
}
