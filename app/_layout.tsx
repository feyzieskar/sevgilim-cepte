// ====================================================================
// KÖK YERLEŞİM (Root Layout)
// ====================================================================
// expo-router'ın giriş noktası. Tüm uygulamayı sarmalar:
//  - global.css: NativeWind stillerini yükler (ÇOK ÖNEMLİ, en üstte)
//  - GestureHandlerRootView: jest/gesture tabanlı bileşenler için
//  - SafeAreaProvider: çentik/ekran güvenli alanları için
//  - Başlangıçta cihaz temasını uygulamaya uygular
// ====================================================================

import "@/global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useThemeStore } from "@/store/useThemeStore";

export default function RootLayout() {
  // Cihazın sistem teması (açık/koyu)
  const sistemTemasi = useColorScheme();
  const temaAyarla = useThemeStore((s) => s.temaAyarla);

  // Uygulama açılırken cihaz temasını başlangıç değeri olarak uygula
  useEffect(() => {
    temaAyarla(sistemTemasi === "dark" ? "dark" : "light");
  }, [sistemTemasi, temaAyarla]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
