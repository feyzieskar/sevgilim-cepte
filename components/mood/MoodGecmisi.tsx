// ====================================================================
// MoodGecmisi — son günlerin emoji satırı
// ====================================================================

import { Text, View } from "react-native";

import { tarihKisa } from "@/constants/tarih";
import { SHADOWS } from "@/constants/theme";
import { GunlukMoodOzet } from "@/store/moodStore";
import { usePalet } from "@/store/useThemeStore";

interface MoodGecmisiProps {
  history: GunlukMoodOzet[];
  limit?: number;
}

export function MoodGecmisi({ history, limit = 14 }: MoodGecmisiProps) {
  const palet = usePalet();
  const gosterilen = history.slice(0, limit);

  if (gosterilen.length === 0) {
    return (
      <View
        className="items-center rounded-2xl py-8"
        style={{ backgroundColor: palet.yuzey, ...SHADOWS.yumusak }}
      >
        <Text style={{ color: palet.metinIkincil }}>Henüz ruh hali geçmişi yok 🌈</Text>
      </View>
    );
  }

  return (
    <View className="gap-2">
      {gosterilen.map((gun) => (
        <View
          key={gun.date}
          className="flex-row items-center justify-between rounded-2xl px-4 py-3"
          style={{ backgroundColor: palet.yuzey, ...SHADOWS.yumusak }}
        >
          <Text className="font-semibold" style={{ color: palet.metin }}>
            {tarihKisa(gun.date)}
          </Text>
          <View className="flex-row items-center gap-4">
            <View className="items-center">
              <Text className="text-xs" style={{ color: palet.metinIkincil }}>
                Sen
              </Text>
              <Text style={{ fontSize: 22 }}>{gun.benim?.emoji ?? "—"}</Text>
            </View>
            <View className="items-center">
              <Text className="text-xs" style={{ color: palet.metinIkincil }}>
                Partner
              </Text>
              <Text style={{ fontSize: 22 }}>{gun.partnerin?.emoji ?? "—"}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
