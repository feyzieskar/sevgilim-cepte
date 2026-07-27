// ====================================================================
// YEMEK ÖNERİLERİ (Karnım Acıktı bölümü)
// ====================================================================
// Açlık seviyesine göre basit yerel liste. İleride Feyzi AI ile
// dinamik öneri yapılabilir.
// ====================================================================

export type AciklikSeviyesi = "az" | "normal" | "cok";

export const ACIKLIK_SECENEKLERI: {
  seviye: AciklikSeviyesi;
  etiket: string;
}[] = [
  { seviye: "az", etiket: "Az açım" },
  { seviye: "normal", etiket: "Acıktım" },
  { seviye: "cok", etiket: "Çok açım 😩" },
];

const ONERILER: Record<AciklikSeviyesi, string[]> = {
  az: [
    "Meyve tabağı 🍓",
    "Yoğurt ve granola 🥣",
    "Tost 🍞",
    "Çay saati kurabiyesi 🍪",
    "Smoothie 🥤",
  ],
  normal: [
    "Ev yapımı makarna 🍝",
    "Tavuk sote ve pilav 🍗",
    "Lahmacun / pide 🥙",
    "Köfte patates 🥔",
    "Mantı veya ravioli 🥟",
  ],
  cok: [
    "Burger menü 🍔",
    "Pizza (büyük boy) 🍕",
    "Kebap ve lahmacun 🌯",
    "Sushi seti 🍣",
    "Ev yapımı lahmacun + ayran 🥤",
  ],
};

/** Seviyeye göre rastgele bir yemek önerisi döndürür. */
export function rastgeleYemekOner(seviye: AciklikSeviyesi): string {
  const liste = ONERILER[seviye];
  return liste[Math.floor(Math.random() * liste.length)];
}

/** Seviye kodundan kullanıcıya gösterilen etiketi bulur. */
export function aciklikEtiketi(seviye: AciklikSeviyesi): string {
  return (
    ACIKLIK_SECENEKLERI.find((x) => x.seviye === seviye)?.etiket ?? seviye
  );
}
