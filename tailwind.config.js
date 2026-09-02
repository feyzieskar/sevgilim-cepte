/** @type {import('tailwindcss').Config} */
// Tailwind / NativeWind yapılandırması
// content: Hangi dosyalarda sınıf araması yapılacağını belirtir
// theme.extend.colors: Uygulamanın romantik renk paletini Tailwind'e tanıtır
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class", // Tema değişimini manuel kontrol edebilmek için
  theme: {
    extend: {
      colors: {
        // Ana marka renkleri (soft pembe + lila)
        primary: {
          DEFAULT: "#FF6B9D",
          light: "#FFA0C2",
          dark: "#E14D80",
        },
        secondary: {
          DEFAULT: "#A06CD5",
          light: "#C9A7EC",
          dark: "#7E4BB8",
        },
        // Kategori renkleri (takvim)
        kategori: {
          tatil: "#5B9BD5", // mavi
          bulusma: "#FF6B9D", // pembe
          ozel: "#A06CD5", // mor
          is: "#9AA1A9", // gri
        },
      },
      borderRadius: {
        card: "24px",
      },
      fontFamily: {
        // İsteğe bağlı: özel font eklenince burada tanımlanır
      },
    },
  },
  plugins: [],
};
