// ====================================================================
// StreakSayaci — büyük ateş ikonu + streak sayısı
// ====================================================================

import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Flame } from "lucide-react-native";

import { RADIUS, SHADOWS } from "@/constants/theme";
import { usePalet } from "@/store/useThemeStore";

interface StreakSayaciProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakSayaci({ currentStreak, longestStreak }: StreakSayaciProps) {
  const palet = usePalet();
  const olcek = useSharedValue(1);

  useEffect(() => {
    if (currentStreak > 0) {
      olcek.value = withRepeat(
        withSequence(withTiming(1.08, { duration: 700 }), withTiming(1, { duration: 700 })),
        -1,
        true
      );
    } else {
      olcek.value = withTiming(1);
    }
  }, [currentStreak, olcek]);

  const animStil = useAnimatedStyle(() => ({
    transform: [{ scale: olcek.value }],
  }));

  return (
    <View
      className="items-center rounded-3xl py-8"
      style={{
        backgroundColor: palet.yuzey,
        borderRadius: RADIUS.lg,
        ...SHADOWS.kart,
      }}
    >
      <Animated.View style={animStil}>
        <View
          className="h-24 w-24 items-center justify-center rounded-full"
          style={{ backgroundColor: `${palet.primary}20` }}
        >
          <Flame
            size={52}
            color={currentStreak > 0 ? "#FF6B35" : palet.metinIkincil}
            strokeWidth={2.2}
            fill={currentStreak > 0 ? "#FF6B3522" : "transparent"}
          />
        </View>
      </Animated.View>

      <Text className="mt-4 text-5xl font-bold" style={{ color: palet.metin }}>
        {currentStreak}
      </Text>
      <Text className="mt-1 text-lg font-semibold" style={{ color: palet.primary }}>
        gün 🔥
      </Text>

      {longestStreak > 0 ? (
        <Text className="mt-3" style={{ color: palet.metinIkincil }}>
          En uzun seri: {longestStreak} gün
        </Text>
      ) : null}
    </View>
  );
}
