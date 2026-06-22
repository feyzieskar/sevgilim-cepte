// ====================================================================
// TEMA & RENK SİSTEMİ
// ====================================================================
// Uygulamanın tüm renk, boşluk, köşe yarıçapı ve gölge değerleri burada
// tek bir yerden yönetilir. NativeWind (className) ile çözemediğimiz
// durumlar (örn. LinearGradient renkleri, gölgeler, dinamik tema) için
// bu sabitleri doğrudan TypeScript'te kullanırız.
// ====================================================================

// --- Marka renkleri (temadan bağımsız sabit tonlar) ---
export const BRAND = {
  pembe: "#FF6B9D",
  pembeAcik: "#FFA0C2",
  pembeKoyu: "#E14D80",
  lila: "#A06CD5",
  lilaAcik: "#C9A7EC",
  lilaKoyu: "#7E4BB8",
} as const;

// --- Takvim kategori renkleri (Bölüm 2) ---
export const KATEGORI_RENKLERI = {
  tatil: "#5B9BD5", // mavi
  bulusma: "#FF6B9D", // pembe
  ozel: "#A06CD5", // mor
  is: "#9AA1A9", // gri
} as const;

export type KategoriAnahtari = keyof typeof KATEGORI_RENKLERI;

// --- Sık kullanılan gradyanlar (LinearGradient için renk dizileri) ---
export const GRADIENTS = {
  // Ana romantik gradyan: pembe -> lila
  romantik: ["#FF6B9D", "#A06CD5"] as const,
  // Yumuşak günbatımı
  gunbatimi: ["#FFA0C2", "#C9A7EC"] as const,
  // Sıcak vurgu
  sicak: ["#FF8FB1", "#FF6B9D"] as const,
  // Sakin lila
  sakin: ["#C9A7EC", "#A06CD5"] as const,
};

// --- Açık tema paleti ---
export const LIGHT = {
  arkaplan: "#FFF0F6", // çok açık pembe zemin
  yuzey: "#FFFFFF", // kart yüzeyi
  yuzeyIkincil: "#FDF2F8",
  metin: "#2B2230", // ana metin
  metinIkincil: "#6B5E73", // soluk metin
  kenarlik: "#F3D9E6",
  primary: BRAND.pembe,
  secondary: BRAND.lila,
};

// --- Koyu tema paleti ---
export const DARK = {
  arkaplan: "#1A1520",
  yuzey: "#241D2C",
  yuzeyIkincil: "#2E2538",
  metin: "#F5EEF7",
  metinIkincil: "#B7A8C2",
  kenarlik: "#3A2F45",
  primary: BRAND.pembeAcik,
  secondary: BRAND.lilaAcik,
};

export type RenkPaleti = typeof LIGHT;

// --- Boşluk ölçeği (8'lik grid) ---
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// --- Köşe yarıçapları ---
export const RADIUS = {
  sm: 12,
  md: 16,
  lg: 24,
  full: 999,
} as const;

// --- Gölge stilleri (iOS + Android) ---
export const SHADOWS = {
  kart: {
    shadowColor: "#A06CD5",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  yumusak: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;

// Bir tema moduna göre doğru paleti döndüren yardımcı
export function getPalet(mod: "light" | "dark"): RenkPaleti {
  return mod === "dark" ? DARK : LIGHT;
}
