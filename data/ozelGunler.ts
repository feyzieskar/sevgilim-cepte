// ====================================================================
// BİZE ÖZEL GÜNLER
// ====================================================================
// Yıldönümü, doğum günleri gibi her yıl tekrar eden özel günler.
// Ana ekrandaki "Sonraki Özel Gün" kartı ve Takvim'deki "Bize Özel
// Günler" sekmesi bu listeyi kullanır.
//
// ay: 1-12, gun: 1-31 (yıl bilgisi tutulmaz; her yıl tekrar eder)
// ====================================================================

export interface OzelGun {
  id: string;
  baslik: string;
  ay: number; // 1 = Ocak
  gun: number;
  emoji: string;
}

export const OZEL_GUNLER: OzelGun[] = [
  { id: "tanisma", baslik: "Tanışma Yıldönümümüz", ay: 9, gun: 14, emoji: "💕" },
  { id: "sevgili", baslik: "Sevgili Olduğumuz Gün", ay: 10, gun: 2, emoji: "💘" },
  { id: "onun-dogum", baslik: "Doğum Günün", ay: 4, gun: 23, emoji: "🎂" },
  { id: "benim-dogum", baslik: "Benim Doğum Günüm", ay: 7, gun: 8, emoji: "🎉" },
  { id: "ilk-tatil", baslik: "İlk Tatilimiz", ay: 6, gun: 19, emoji: "🏖️" },
  { id: "sevgililer", baslik: "Sevgililer Günü", ay: 2, gun: 14, emoji: "🌹" },
];

// ---------------------------------------------------------------
// Yardımcı: Bir özel günün bu yıl/gelecek yıl içindeki bir sonraki
// gerçekleşme tarihini Date olarak döndürür.
// ---------------------------------------------------------------
export function sonrakiTarih(gun: OzelGun, bugun: Date = new Date()): Date {
  const yil = bugun.getFullYear();
  let hedef = new Date(yil, gun.ay - 1, gun.gun);
  // Saat farklarından etkilenmemek için bugünü gün başına çekiyoruz
  const bugunBaslangic = new Date(
    bugun.getFullYear(),
    bugun.getMonth(),
    bugun.getDate()
  );
  if (hedef < bugunBaslangic) {
    hedef = new Date(yil + 1, gun.ay - 1, gun.gun);
  }
  return hedef;
}

// ---------------------------------------------------------------
// Yardımcı: Bugünden hedefe kaç tam gün kaldığını hesaplar.
// ---------------------------------------------------------------
export function kalanGun(hedef: Date, bugun: Date = new Date()): number {
  const birGunMs = 1000 * 60 * 60 * 24;
  const bugunBaslangic = new Date(
    bugun.getFullYear(),
    bugun.getMonth(),
    bugun.getDate()
  );
  return Math.round((hedef.getTime() - bugunBaslangic.getTime()) / birGunMs);
}

// ---------------------------------------------------------------
// Yardımcı: En yakın özel günü ve kalan gün sayısını bulur.
// ---------------------------------------------------------------
export function enYakinOzelGun(bugun: Date = new Date()): {
  gun: OzelGun;
  tarih: Date;
  kalan: number;
} | null {
  if (OZEL_GUNLER.length === 0) return null;

  const adaylar = OZEL_GUNLER.map((g) => {
    const tarih = sonrakiTarih(g, bugun);
    return { gun: g, tarih, kalan: kalanGun(tarih, bugun) };
  });

  adaylar.sort((a, b) => a.kalan - b.kalan);
  return adaylar[0];
}
