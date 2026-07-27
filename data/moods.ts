// ====================================================================
// RUH HALİ SEÇENEKLERİ
// ====================================================================

export type MoodTipi =
  | "mutlu"
  | "keyifli"
  | "normal"
  | "yorgun"
  | "uzgun"
  | "stresli";

export interface MoodSecenegi {
  id: MoodTipi;
  emoji: string;
  etiket: string;
  renk: string;
}

export const MOOD_SECENEKLERI: MoodSecenegi[] = [
  { id: "mutlu", emoji: "😄", etiket: "Mutlu", renk: "#FFD93D" },
  { id: "keyifli", emoji: "🙂", etiket: "Keyifli", renk: "#A8E6CF" },
  { id: "normal", emoji: "😐", etiket: "Normal", renk: "#B8C5D6" },
  { id: "yorgun", emoji: "😴", etiket: "Yorgun", renk: "#C9B8E8" },
  { id: "uzgun", emoji: "😢", etiket: "Üzgün", renk: "#89CFF0" },
  { id: "stresli", emoji: "😰", etiket: "Stresli", renk: "#FFB4B4" },
];

export function moodBilgisi(mood: MoodTipi): MoodSecenegi {
  return (
    MOOD_SECENEKLERI.find((m) => m.id === mood) ?? MOOD_SECENEKLERI[2]
  );
}

/** Üzgün veya stresli ruh hali mi? (şefkat aksiyonu için) */
export function dusukMoodMu(mood: MoodTipi): boolean {
  return mood === "uzgun" || mood === "stresli";
}
