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

// Bir tarihin kaç yıl önce olduğunu döndürür (bu yıl = 0).
export function yilOnce(iso: string, bugun: Date = new Date()): number {
  const yil = isoToDate(iso).getFullYear();
  return bugun.getFullYear() - yil;
}

// "Geçen yıl bugün" / "3 yıl önce bugün" / "Bugün" gibi metin üretir.
export function gunMetni(iso: string, bugun: Date = new Date()): string {
  const fark = yilOnce(iso, bugun);
  if (fark <= 0) return "Bugün";
  if (fark === 1) return "Geçen yıl bugün";
  return `${fark} yıl önce bugün`;
}
