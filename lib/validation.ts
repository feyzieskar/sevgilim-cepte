// ====================================================================
// DOĞRULAMA YARDIMCILARI
// ====================================================================
// Tarih, saat ve metin doğrulama için hafif yardımcı fonksiyonlar.
// Dış bağımlılık gerektirmez. Edge Function ve client tarafında
// ortaklaşa kullanılabilir.
// ====================================================================

/**
 * YYYY-MM-DD formatında bir tarihin gerçek takvim tarihi olup
 * olmadığını doğrular. Örn. "2026-02-31" → false.
 */
export function isValidDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return false;
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/**
 * HH:mm formatında saat doğrular (00:00 – 23:59).
 */
export function isValidTime(time: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(time)) return false;
  const [h, m] = time.split(":").map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

/**
 * Bir metni verilen maksimum uzunlukta keser.
 * Eğer metin sınırdan kısaysa olduğu gibi döner.
 */
export function clampString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength);
}

/**
 * Ay (1-12) ve gün (1-31) kombinasyonunun geçerli olup olmadığını kontrol eder.
 * Artık yıl toleranslı (29 Şubat her zaman kabul edilir).
 */
export function isValidDayMonth(day: number, month: number): boolean {
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  // Artık yıl toleranslı kontrol (2024 artık yıl)
  const testDate = new Date(2024, month - 1, day);
  return testDate.getMonth() === month - 1 && testDate.getDate() === day;
}
