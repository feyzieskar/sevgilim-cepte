// ====================================================================
// TAKVİM KATEGORİLERİ
// ====================================================================
// Etkinlik kategorileri, renkleri, Türkçe etiketleri ve ikonları.
// Hem takvim noktaları (marked dots) hem de kategori seçici/kartlar
// bu tek kaynaktan beslenir.
// ====================================================================

import { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

// Veri modelindeki kategori anahtarları (spec ile birebir)
export type EventCategory = "tatil" | "bulusma" | "ozel_gun" | "is_okul";

export interface KategoriBilgisi {
  anahtar: EventCategory;
  etiket: string; // arayüzde görünen Türkçe ad
  renk: string; // takvim noktası / vurgu rengi
  ikon: ComponentProps<typeof Ionicons>["name"];
}

// Kategori -> görsel bilgi eşlemesi (renkler spec'te belirtilen değerler)
export const KATEGORILER: Record<EventCategory, KategoriBilgisi> = {
  tatil: { anahtar: "tatil", etiket: "Tatil", renk: "#4A90E2", ikon: "airplane" },
  bulusma: { anahtar: "bulusma", etiket: "Buluşma", renk: "#FF6B9D", ikon: "heart" },
  ozel_gun: { anahtar: "ozel_gun", etiket: "Özel Gün", renk: "#A06CD5", ikon: "star" },
  is_okul: { anahtar: "is_okul", etiket: "İş / Okul", renk: "#8E8E93", ikon: "briefcase" },
};

// Sıralı liste (kategori seçici için)
export const KATEGORI_LISTESI: KategoriBilgisi[] = Object.values(KATEGORILER);

// Güvenli erişim: bilinmeyen anahtarda buluşma rengine düş
export function kategoriBilgisi(kategori: EventCategory): KategoriBilgisi {
  return KATEGORILER[kategori] ?? KATEGORILER.bulusma;
}
