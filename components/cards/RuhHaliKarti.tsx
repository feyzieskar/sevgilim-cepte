// ====================================================================
// RuhHaliKarti  (Ana ekran kartı)
// ====================================================================
// Bugünkü sen + partner ruh hali emojilerini hızlı gösterir.
// Tıklanınca detay ekranına gider.
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Text, View } from "react-native";

import { GradientCard } from "@/components/ui/GradientCard";
import { moodBilgisi } from "@/data/moods";
import { useAuthStore } from "@/store/authStore";
import { useMoodStore } from "@/store/moodStore";
import { usePalet } from "@/store/useThemeStore";

export function RuhHaliKarti() {
  const palet = usePalet();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const todayMoods = useMoodStore((s) => s.todayMoods);
  const partnerId = useMoodStore((s) => s.partnerId);

  const benim = useMemo(
    () => todayMoods.find((m) => m.createdBy === userId),
    [todayMoods, userId]
  );
  const partnerin = useMemo(
    () => (partnerId ? todayMoods.find((m) => m.createdBy === partnerId) : undefined),
    [todayMoods, partnerId]
  );

  return (
    <GradientCard onPress={() => router.push("/ruh-hali")}>
      <View className="flex-row items-center">
        <View
          className="mr-3 h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: palet.yuzeyIkincil }}
        >
          <Ionicons name="happy-outline" size={20} color={palet.primary} />
        </View>
        <Text
          className="text-sm font-semibold uppercase"
          style={{ color: palet.metinIkincil, letterSpacing: 1 }}
        >
          Ruh Hali
        </Text>
      </View>

      <View className="mt-4 flex-row items-center justify-around">
        <EmojiKutu etiket="Sen" emoji={benim?.emoji} bos="?" />
        <Text style={{ fontSize: 20, color: palet.metinIkincil }}>💕</Text>
        <EmojiKutu etiket="Partner" emoji={partnerin?.emoji} bos="?" />
      </View>

      <Text className="mt-3 text-center text-sm" style={{ color: palet.metinIkincil }}>
        {benim
          ? `Sen bugün ${moodBilgisi(benim.mood).etiket.toLowerCase()} hissediyorsun`
          : "Bugün nasıl hissediyorsun? Dokun ve paylaş 🌈"}
      </Text>
    </GradientCard>
  );
}

function EmojiKutu({
  etiket,
  emoji,
  bos,
}: {
  etiket: string;
  emoji?: string;
  bos: string;
}) {
  const palet = usePalet();

  return (
    <View className="items-center">
      <Text className="text-xs font-semibold" style={{ color: palet.metinIkincil }}>
        {etiket}
      </Text>
      <Text className="mt-1" style={{ fontSize: 36 }}>
        {emoji ?? bos}
      </Text>
    </View>
  );
}
