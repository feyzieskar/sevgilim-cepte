// ====================================================================
// KÖK YERLEŞİM (Root Layout)
// ====================================================================
// expo-router'ın giriş noktası. Tüm uygulamayı sarmalar:
//  - global.css: NativeWind stillerini yükler (ÇOK ÖNEMLİ, en üstte)
//  - GestureHandlerRootView: jest/gesture tabanlı bileşenler için
//  - SafeAreaProvider: çentik/ekran güvenli alanları için
//  - Başlangıçta cihaz temasını uygulamaya uygular
//  - Auth: açılışta session kontrol edilir; giriş yoksa (auth) grubuna,
//    varsa (tabs) grubuna yönlendirilir (route guard).
// ====================================================================

import "@/global.css";

import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, useColorScheme, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useAuthStore } from "@/store/authStore";
import { usePalet, useThemeStore } from "@/store/useThemeStore";

// Oturum durumuna göre doğru gruba yönlendiren guard hook'u.
function useAuthGuard() {
  const session = useAuthStore((s) => s.session);
  const initialized = useAuthStore((s) => s.initialized);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // İlk session kontrolü bitmeden yönlendirme yapma
    if (!initialized) return;

    const authGrubundaMi = segments[0] === "(auth)";

    if (!session && !authGrubundaMi) {
      // Giriş yok -> login'e gönder
      router.replace("/(auth)/login");
    } else if (session && authGrubundaMi) {
      // Giriş var ama hâlâ login'deyiz -> ana uygulamaya gönder
      router.replace("/(tabs)");
    }
  }, [session, initialized, segments, router]);
}

export default function RootLayout() {
  // Cihazın sistem teması (açık/koyu)
  const sistemTemasi = useColorScheme();
  const temaAyarla = useThemeStore((s) => s.temaAyarla);
  const palet = usePalet();

  const initialize = useAuthStore((s) => s.initialize);
  const initialized = useAuthStore((s) => s.initialized);

  // Uygulama açılırken cihaz temasını başlangıç değeri olarak uygula
  useEffect(() => {
    temaAyarla(sistemTemasi === "dark" ? "dark" : "light");
  }, [sistemTemasi, temaAyarla]);

  // Açılışta kayıtlı session'ı yükle (otomatik giriş)
  useEffect(() => {
    initialize();
  }, [initialize]);

  useAuthGuard();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        {initialized ? (
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        ) : (
          // Session kontrol edilirken kısa bir yükleme ekranı
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: palet.arkaplan,
            }}
          >
            <ActivityIndicator size="large" color={palet.primary} />
          </View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
