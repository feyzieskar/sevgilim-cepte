// ====================================================================
// BUCKET LİST KATEGORİLERİ
// ====================================================================

export type BucketKategori =
  | "gezi"
  | "yemek"
  | "aktivite"
  | "hayal"
  | "diger";

export interface BucketKategoriBilgi {
  id: BucketKategori;
  etiket: string;
  emoji: string;
  renk: string;
}

export const BUCKET_KATEGORILERI: BucketKategoriBilgi[] = [
  { id: "gezi", etiket: "Gezi", emoji: "✈️", renk: "#5B9BD5" },
  { id: "yemek", etiket: "Yemek", emoji: "🍽️", renk: "#FF6B9D" },
  { id: "aktivite", etiket: "Aktivite", emoji: "🎯", renk: "#A06CD5" },
  { id: "hayal", etiket: "Hayal", emoji: "✨", renk: "#FFD93D" },
  { id: "diger", etiket: "Diğer", emoji: "💫", renk: "#9AA1A9" },
];

export function kategoriBilgisi(
  kategori: BucketKategori
): BucketKategoriBilgi {
  return (
    BUCKET_KATEGORILERI.find((k) => k.id === kategori) ??
    BUCKET_KATEGORILERI[4]
  );
}
