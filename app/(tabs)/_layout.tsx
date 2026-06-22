// ====================================================================
// ALT TAB BAR YERLEŞİMİ
// ====================================================================
// 5 sekmeli alt navigasyon:
//   🏠 Bugün Biz | 📅 Takvim | 📸 Anılar | 💬 Feyzi AI | 🎁 Sürprizler
// Sekme ikonları @expo/vector-icons (Ionicons) ile çizilir.
// Renkler aktif tema paletine göre belirlenir.
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { usePalet } from "@/store/useThemeStore";

export default function TabsLayout() {
  const palet = usePalet();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palet.primary,
        tabBarInactiveTintColor: palet.metinIkincil,
        tabBarStyle: {
          backgroundColor: palet.yuzey,
          borderTopColor: palet.kenarlik,
          height: 88,
          paddingTop: 8,
          paddingBottom: 28,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Bugün Biz",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="takvim"
        options={{
          title: "Takvim",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="anilar"
        options={{
          title: "Anılar",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="images" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="feyzi-ai"
        options={{
          title: "Feyzi AI",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="surprizler"
        options={{
          title: "Sürprizler",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="gift" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
