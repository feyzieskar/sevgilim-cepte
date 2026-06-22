// ====================================================================
// SUPABASE CLIENT
// ====================================================================
// Uygulamanın bulut backend'i. Tek bir client örneği burada oluşturulur
// ve her yerden import edilir.
//
//  - Oturum (session) AsyncStorage'da kalıcı tutulur -> uygulama yeniden
//    açıldığında otomatik giriş yapılır.
//  - autoRefreshToken: access token süresi dolunca otomatik yeniler.
//  - detectSessionInUrl: false -> React Native'de URL tabanlı session yok.
//  - react-native-url-polyfill: supabase-js'in URL API'sine ihtiyacı var.
//
// Anahtarlar .env'den (EXPO_PUBLIC_ önekiyle build'e gömülür) okunur.
// ====================================================================

import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Geliştirme sırasında anahtar unutulduysa erken uyar.
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY eksik. " +
      ".env dosyasına ekleyip uygulamayı yeniden başlat."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Uygulama ön plandayken token'ı otomatik yenile, arka plana geçince durdur.
// (Supabase'in React Native için önerdiği standart kurulum.)
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
