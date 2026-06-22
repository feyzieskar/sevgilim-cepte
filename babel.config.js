// Babel yapılandırması
// - babel-preset-expo: Expo projeleri için temel preset
// - jsxImportSource "nativewind": className prop'unun NativeWind tarafından
//   işlenebilmesi için gereklidir
// - "nativewind/babel": Tailwind sınıflarını native stillere derler
// NOT: react-native-reanimated/react-native-worklets eklenince ilgili plugin
//      listenin EN SONUNDA olmalıdır.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // Reanimated kullanılınca bu satır mutlaka en sonda kalmalı:
      "react-native-worklets/plugin",
    ],
  };
};
