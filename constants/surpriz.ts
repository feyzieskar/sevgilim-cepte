// ====================================================================
// SÜRPRİZ SABİTLERİ
// ====================================================================
// Sürprizlerin açılma tipleri (UnlockType), arayüz etiketleri,
// ikonları, renkleri ve kilitliyken gösterilecek ipucu metinleri.
// ====================================================================

import { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

// Açılma tipi (spec ile birebir)
export type UnlockType = "date" | "sad" | "miss" | "before_trip";

// Tatile "kaç gün kala" otomatik açılabilir olsun? (before_trip)
export const TATIL_ESIK_GUN = 3;

type IkonAdi = ComponentProps<typeof Ionicons>["name"];

export interface UnlockTuru {
  tip: UnlockType;
  etiket: string; // formda görünen ad
  ikon: IkonAdi;
  renk: string; // kart vurgu rengi
  // Tarih gerektiriyor mu? (date / before_trip)
  tarihGerekir: boolean;
}

// Her açılma tipinin görsel/işlevsel bilgisi
export const UNLOCK_TURLERI: Record<UnlockType, UnlockTuru> = {
  date: {
    tip: "date",
    etiket: "Belirli tarihte",
    ikon: "calendar",
    renk: "#A06CD5",
    tarihGerekir: true,
  },
  sad: {
    tip: "sad",
    etiket: "Kötü hissettiğinde",
    ikon: "rainy",
    renk: "#5B9BD5",
    tarihGerekir: false,
  },
  miss: {
    tip: "miss",
    etiket: "Beni özlediğinde",
    ikon: "heart-dislike",
    renk: "#FF6B9D",
    tarihGerekir: false,
  },
  before_trip: {
    tip: "before_trip",
    etiket: "Tatile az kala",
    ikon: "airplane",
    renk: "#4A90E2",
    tarihGerekir: true,
  },
};

// Sıralı liste (form seçici için)
export const UNLOCK_LISTESI: UnlockTuru[] = Object.values(UNLOCK_TURLERI);

// Kilitliyken kartta gösterilecek ipucu metni
export function kilitIpucu(tip: UnlockType, unlockDate?: string): string {
  switch (tip) {
    case "date":
      return "Doğru zaman gelince açılacak 🔒";
    case "sad":
      return "Kötü hissettiğinde aç 💙";
    case "miss":
      return "Beni özlediğinde aç 🥺";
    case "before_trip":
      return "Tatile az kala açılacak ✈️";
    default:
      return "Kilitli 🔒";
  }
}
