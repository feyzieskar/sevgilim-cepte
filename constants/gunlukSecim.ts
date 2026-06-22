// ====================================================================
// GÜNLÜK SEÇİM YARDIMCISI
// ====================================================================
// "Günün Mesajı" ve "Bugün Seni Sevme Sebebim" kartları her gün
// listeden sıralı/deterministik bir eleman gösterir. Aynı gün içinde
// uygulama kaç kez açılırsa açılsın aynı eleman gelir; ertesi gün
// bir sonrakine geçer.
// ====================================================================

// Yılın kaçıncı günü olduğunu döndürür (1-366).
export function yilinGunu(tarih: Date = new Date()): number {
  const yilBasi = new Date(tarih.getFullYear(), 0, 0);
  const fark = tarih.getTime() - yilBasi.getTime();
  const birGunMs = 1000 * 60 * 60 * 24;
  return Math.floor(fark / birGunMs);
}

// Bir listeden "bugüne" karşılık gelen elemanı seçer.
// Liste boşsa undefined döner.
export function gununElemaniniSec<T>(liste: T[], tarih: Date = new Date()): T | undefined {
  if (liste.length === 0) return undefined;
  const indeks = yilinGunu(tarih) % liste.length;
  return liste[indeks];
}
