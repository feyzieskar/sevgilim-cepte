// ====================================================================
// BİZE ÖZEL GÜNLER (yardımcılar + tip)
// ====================================================================
// Yıldönümü, doğum günleri gibi her yıl tekrar eden özel günler artık
// Supabase'de saklanır (bkz. store/ozelGunStore.ts). Bu dosya yalnızca
// ortak tip (OzelGun) ve tarih hesaplama yardımcılarını barındırır.
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

// ---------------------------------------------------------------
// Yardımcı: Bir özel günün bu yıl/gelecek yıl içindeki bir sonraki
// gerçekleşme tarihini Date olarak döndürür.
// ---------------------------------------------------------------
export function sonrakiTarih(gun: OzelGun, bugun: Date = new Date()): Date {
  const yil = bugun.getFullYear();
  let hedef = new Date(yil, gun.ay - 1, gun.gun);
  // Saat farklarından etkilenmemek için bugünü gün başına çekiyoruz
  const bugunBaslangic = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate());
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
  const bugunBaslangic = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate());
  return Math.round((hedef.getTime() - bugunBaslangic.getTime()) / birGunMs);
}

// ---------------------------------------------------------------
// Yardımcı: Verilen listede en yakın özel günü ve kalan gün sayısını bulur.
// ---------------------------------------------------------------
export function enYakinOzelGun(
  liste: OzelGun[],
  bugun: Date = new Date()
): {
  gun: OzelGun;
  tarih: Date;
  kalan: number;
} | null {
  if (liste.length === 0) return null;

  const adaylar = liste.map((g) => {
    const tarih = sonrakiTarih(g, bugun);
    return { gun: g, tarih, kalan: kalanGun(tarih, bugun) };
  });

  adaylar.sort((a, b) => a.kalan - b.kalan);
  return adaylar[0];
}
