// ====================================================================
// ALT TAB BAR YERLEŞİMİ
// ====================================================================
// Alt navigasyon:
//   🏠 Bugün Biz | 🔥 Streak | 📅 Takvim | 💕 Feyzi AI | ☰ Menü
// Anılar / Duygular Menü altından stack route olarak açılır.
// Eski tab rotaları Redirect ile korunur (bildirim / eski linkler).
// Renkler aktif tema paletine göre belirlenir.
// ====================================================================

import { Tabs } from "expo-router";
import { useEffect } from "react";
import { Calendar, Flame, Home, Menu, MessageCircle } from "lucide-react-native";

import { useCalendarStore } from "@/store/calendarStore";
import { useChatStore } from "@/store/chatStore";
import { useLoveReasonStore } from "@/store/loveReasonStore";
import { useMemoryStore } from "@/store/memoryStore";
import { useOzelGunStore } from "@/store/ozelGunStore";
import { useEmotionStore } from "@/store/emotionStore";
import { useSurpriseStore } from "@/store/surpriseStore";
import { useBucketListStore } from "@/store/bucketListStore";
import { useMoodStore } from "@/store/moodStore";
import { useStreakStore } from "@/store/streakStore";
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
  const yukleStreak = useStreakStore((s) => s.yukle);
  const yukleMood = useMoodStore((s) => s.yukle);
  const fetchBucketList = useBucketListStore((s) => s.fetchItems);
  const subscribeEvents = useCalendarStore((s) => s.subscribeRealtime);
  const subscribeSurprises = useSurpriseStore((s) => s.subscribeRealtime);
  const subscribeEmotions = useEmotionStore((s) => s.subscribeRealtime);
  const subscribeReasons = useLoveReasonStore((s) => s.subscribeRealtime);
  const subscribeOzelGunler = useOzelGunStore((s) => s.subscribeRealtime);
  const subscribeStreak = useStreakStore((s) => s.subscribeRealtime);
  const subscribeMood = useMoodStore((s) => s.subscribeRealtime);
  const subscribeBucketList = useBucketListStore((s) => s.subscribeRealtime);

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
    yukleStreak();
    yukleMood();
    fetchBucketList();
  }, [
    fetchEvents,
    fetchMemories,
    fetchSurprises,
    fetchEmotions,
    fetchReasons,
    fetchMessages,
    fetchOzelGunler,
    yukleStreak,
    yukleMood,
    fetchBucketList,
  ]);

  // Realtime: partner etkinlik/sürpriz/sevme sebebi/özel gün eklediğinde ekran anında güncellenir.
  useEffect(() => {
    const unsubEvents = subscribeEvents();
    const unsubSurprises = subscribeSurprises();
    const unsubEmotions = subscribeEmotions();
    const unsubReasons = subscribeReasons();
    const unsubOzelGunler = subscribeOzelGunler();
    const unsubStreak = subscribeStreak();
    const unsubMood = subscribeMood();
    const unsubBucketList = subscribeBucketList();
    return () => {
      unsubEvents();
      unsubSurprises();
      unsubEmotions();
      unsubReasons();
      unsubOzelGunler();
      unsubStreak();
      unsubMood();
      unsubBucketList();
    };
  }, [
    subscribeEvents,
    subscribeSurprises,
    subscribeReasons,
    subscribeOzelGunler,
    subscribeEmotions,
    subscribeStreak,
    subscribeMood,
    subscribeBucketList,
  ]);

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
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="streak"
        options={{
          title: "Streak",
          tabBarIcon: ({ color, size }) => <Flame size={size} color={color} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="takvim"
        options={{
          title: "Takvim",
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="feyzi-ai"
        options={{
          title: "Feyzi AI",
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={size} color={color} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: "Menü",
          tabBarIcon: ({ color, size }) => <Menu size={size} color={color} strokeWidth={2.2} />,
        }}
      />
    </Tabs>
  );
}
