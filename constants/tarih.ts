// ====================================================================
// TARİH YARDIMCILARI (Türkçe biçimlendirme)
// ====================================================================

export const AYLAR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export const GUNLER = [
  "Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi",
];

// Bugünün tarihini "YYYY-MM-DD" formatında verir.
export function bugunISO(tarih: Date = new Date()): string {
  const y = tarih.getFullYear();
  const m = String(tarih.getMonth() + 1).padStart(2, "0");
  const g = String(tarih.getDate()).padStart(2, "0");
  return `${y}-${m}-${g}`;
}

// "YYYY-MM-DD" -> Date (yerel saat, gün başı)
export function isoToDate(iso: string): Date {
  const [y, m, g] = iso.split("-").map(Number);
  return new Date(y, m - 1, g);
}

// "YYYY-MM-DD" -> "22 Haziran 2026, Pazartesi"
export function tarihUzun(iso: string): string {
  const d = isoToDate(iso);
  return `${d.getDate()} ${AYLAR[d.getMonth()]} ${d.getFullYear()}, ${GUNLER[d.getDay()]}`;
}

// "YYYY-MM-DD" -> "22 Haziran" (kısa)
export function tarihKisa(iso: string): string {
  const d = isoToDate(iso);
  return `${d.getDate()} ${AYLAR[d.getMonth()]}`;
}
