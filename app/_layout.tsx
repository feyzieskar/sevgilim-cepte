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
//  - Push: bildirime tıklanınca data.screen ile ilgili sekmeye gider.
// ====================================================================

import "@/global.css";

import * as Notifications from "expo-notifications";
import { Href, Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { ActivityIndicator, useColorScheme, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useAuthStore } from "@/store/authStore";
import { usePalet, useThemeStore } from "@/store/useThemeStore";

// Bildirim data.screen → expo-router yolu
const EKRAN_YOLLARI: Record<string, Href> = {
  surprizler: "/(tabs)/surprizler",
  takvim: "/(tabs)/takvim",
  anilar: "/(tabs)/anilar",
  "feyzi-ai": "/(tabs)/feyzi-ai",
  index: "/(tabs)",
  bugun: "/(tabs)",
  duygular: "/(tabs)", // ileride ayrı sekme olursa güncellenir
};

function bildirimeGoreYonlendir(
  router: ReturnType<typeof useRouter>,
  data: Record<string, unknown> | undefined
) {
  const screen = typeof data?.screen === "string" ? data.screen : null;
  if (!screen) return;
  const yol = EKRAN_YOLLARI[screen] ?? (`/(tabs)/${screen}` as Href);
  try {
    router.push(yol);
  } catch (e) {
    console.warn("[bildirim] yönlendirme hatası:", e);
  }
}

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

// Bildirime tıklanınca ilgili ekrana yönlendirir.
function useBildirimYonlendirme() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const yanitDinleyici = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Uygulama kapalıyken bildirime tıklayıp açıldıysa
    void Notifications.getLastNotificationResponseAsync().then((yanit) => {
      if (!yanit || !session) return;
      const data = yanit.notification.request.content.data as
        | Record<string, unknown>
        | undefined;
      bildirimeGoreYonlendir(router, data);
    });

    // Uygulama açık/arka plandayken tıklama
    yanitDinleyici.current =
      Notifications.addNotificationResponseReceivedListener((yanit) => {
        const data = yanit.notification.request.content.data as
          | Record<string, unknown>
          | undefined;
        bildirimeGoreYonlendir(router, data);
      });

    return () => {
      yanitDinleyici.current?.remove();
    };
  }, [router, session]);
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
  useBildirimYonlendirme();

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
