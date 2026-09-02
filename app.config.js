// ====================================================================
// app.config.js
// ====================================================================
// app.json'daki statik yapılandırmayı alır ve üzerine .env'den gelen
// genel ayarları "extra" altına ekler.
//
// GÜVENLİK: API anahtarları (OpenAI, ElevenLabs, D-ID vb.) bu dosyada
// yer almaz. Bu anahtarlar Supabase Edge Function ortam değişkenleri
// olarak sunucu tarafında saklanır.
//
// EXPO_PUBLIC_ önekli değişkenler uygulama paketine gömülür ve
// yalnızca genel yapılandırma için kullanılmalıdır.
// ====================================================================

export default ({ config }) => ({
  ...config,
  extra: {
    ...(config.extra ?? {}),
    // Kayıt ekranını açıp kapamak için (varsayılan: kapalı)
    allowSignup: process.env.EXPO_PUBLIC_ALLOW_SIGNUP === "true",
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
