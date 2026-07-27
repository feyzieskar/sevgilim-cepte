// ====================================================================
// app.config.js
// ====================================================================
// app.json'daki statik yapılandırmayı alır ve üzerine .env'den gelen
// gizli değerleri "extra" altına ekler. Böylece OPENAI_API_KEY gibi
// anahtarlar koda gömülmeden ortam değişkeninden okunur.
//
// Expo CLI, proje kökündeki .env dosyasını otomatik yükler; bu yüzden
// process.env.OPENAI_API_KEY burada erişilebilir olur.
//
// NOT: "extra" değerleri uygulama paketine gömülür. Tek kişilik özel
//      bir uygulama için bu kabul edilebilir; yine de anahtar
//      uygulama içinde expo-secure-store'a yazılıp oradan okunur.
// ====================================================================

export default ({ config }) => ({
  ...config,
  extra: {
    ...(config.extra ?? {}),
    openaiApiKey: process.env.OPENAI_API_KEY ?? null,
    // Expo Push Token için EAS projectId (eas init sonrası .env'ye yaz)
    eas: {
      ...((config.extra && config.extra.eas) || {}),
      projectId:
        process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
        (config.extra && config.extra.eas && config.extra.eas.projectId) ??
        undefined,
    },
  },
});
