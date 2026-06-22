// ====================================================================
// AUTH GRUBU YERLEŞİMİ
// ====================================================================
// Giriş/kayıt ekranlarını barındıran (auth) grubu. Başlık çubuğu yok.
// ====================================================================

import { Stack } from "expo-router";

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
