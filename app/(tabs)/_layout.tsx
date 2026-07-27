// ====================================================================
// ALT TAB BAR YERLEŞİMİ
// ====================================================================
// 5 sekmeli alt navigasyon:
//   🏠 Bugün Biz | 📅 Takvim | 📸 Anılar | 💬 Feyzi AI | 💕 Duygular
// Sekme ikonları @expo/vector-icons (Ionicons) ile çizilir.
// Renkler aktif tema paletine göre belirlenir.
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect } from "react";

import { useCalendarStore } from "@/store/calendarStore";
import { useChatStore } from "@/store/chatStore";
import { useLoveReasonStore } from "@/store/loveReasonStore";
import { useMemoryStore } from "@/store/memoryStore";
import { useOzelGunStore } from "@/store/ozelGunStore";
import { useEmotionStore } from "@/store/emotionStore";
import { useSurpriseStore } from "@/store/surpriseStore";
import { usePalet } from "@/store/useThemeStore";

export default function TabsLayout() {
  const palet = usePalet();
  const fetchEvents = useCalendarStore((s) => s.fetchEvents);
  const fetchMemories = useMemoryStore((s) => s.fetchMemories);
  const fetchSurprises = useSurpriseStore((s) => s.fetchSurprises);
  const fetchEmotions = useEmotionStore((s) => s.fetchEvents);
  const fetchReasons = useLoveReasonStore((s) => s.fetchReasons);
  const fetchMessages = useChatStore((s) => s.fetchMessages);
  const fetchOzelGunler = useOzelGunStore((s) => s.fetchOzelGunler);
  const subscribeEvents = useCalendarStore((s) => s.subscribeRealtime);
  const subscribeSurprises = useSurpriseStore((s) => s.subscribeRealtime);
  const subscribeEmotions = useEmotionStore((s) => s.subscribeRealtime);
  const subscribeReasons = useLoveReasonStore((s) => s.subscribeRealtime);
  const subscribeOzelGunler = useOzelGunStore((s) => s.subscribeRealtime);

  // Giriş sonrası uygulama açılınca bulut verisini bir kez çek.
  // Böylece hem ana ekran kartları hem ilgili sekmeler aynı veriyi kullanır.
  useEffect(() => {
    fetchEvents();
    fetchMemories();
    fetchSurprises();
    fetchEmotions();
    fetchReasons();
    fetchMessages();
    fetchOzelGunler();
  }, [
    fetchEvents,
    fetchMemories,
    fetchSurprises,
    fetchEmotions,
    fetchReasons,
    fetchMessages,
    fetchOzelGunler,
  ]);

  // Realtime: partner etkinlik/sürpriz/sevme sebebi/özel gün eklediğinde ekran anında güncellenir.
  useEffect(() => {
    const unsubEvents = subscribeEvents();
    const unsubSurprises = subscribeSurprises();
    const unsubEmotions = subscribeEmotions();
    const unsubReasons = subscribeReasons();
    const unsubOzelGunler = subscribeOzelGunler();
    return () => {
      unsubEvents();
      unsubSurprises();
      unsubEmotions();
      unsubReasons();
      unsubOzelGunler();
    };
  }, [subscribeEvents, subscribeSurprises, subscribeReasons, subscribeOzelGunler, subscribeEmotions]);

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
        name="duygular"
        options={{
          title: "Duygular",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
        }}
      />
      {/* Eski rota: push bildirimleri surprizler ekranına yönlenebilir */}
      <Tabs.Screen
        name="surprizler"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
