// ====================================================================
// ETKİNLİKLER (mock veri)
// ====================================================================
// Takvim ve ana ekrandaki "Bugünkü Etkinlik" kartı bu veriyi kullanır.
// Şimdilik statik; ileride Zustand store + yerel veritabanı (SQLite /
// AsyncStorage) ile kalıcı hale getirilecek.
// ====================================================================

import { KategoriAnahtari } from "@/constants/theme";

export interface Etkinlik {
  id: string;
  baslik: string;
  // ISO tarih formatı: "YYYY-MM-DD"
  tarih: string;
  saat?: string; // "HH:mm"
  kategori: KategoriAnahtari;
  not?: string;
}

// Bugünün tarihini "YYYY-MM-DD" formatında üretir (mock veriyi
// "bugüne" denk getirmek için kullanışlı).
export function bugunISO(bugun: Date = new Date()): string {
  const y = bugun.getFullYear();
  const m = String(bugun.getMonth() + 1).padStart(2, "0");
  const g = String(bugun.getDate()).padStart(2, "0");
  return `${y}-${m}-${g}`;
}

// Demo amaçlı: bir etkinliği kasıtlı olarak bugüne denk getiriyoruz ki
// "Bugünkü Etkinlik" kartı dolu görünsün.
export const ETKINLIKLER: Etkinlik[] = [
  {
    id: "e1",
    baslik: "Akşam yemeği 🍝",
    tarih: bugunISO(),
    saat: "20:00",
    kategori: "bulusma",
    not: "Sevdiğin İtalyan restoranı",
  },
  {
    id: "e2",
    baslik: "Sinema gecesi 🎬",
    tarih: "2026-07-04",
    saat: "21:30",
    kategori: "bulusma",
  },
  {
    id: "e3",
    baslik: "Hafta sonu kaçamağı 🏞️",
    tarih: "2026-07-12",
    kategori: "tatil",
    not: "Sapanca'da küçük bir bungalov",
  },
];

// Belirli bir güne ait etkinlikleri döndürür.
export function gununEtkinlikleri(
  tarihISO: string,
  liste: Etkinlik[] = ETKINLIKLER
): Etkinlik[] {
  return liste.filter((e) => e.tarih === tarihISO);
}
