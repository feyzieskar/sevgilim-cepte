// Metro bundler yapılandırması
// withNativeWind: global.css dosyasını NativeWind'in giriş noktası olarak tanıtır
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
