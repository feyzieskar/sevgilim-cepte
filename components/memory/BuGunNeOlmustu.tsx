// ====================================================================
// BuGunNeOlmustu
// ====================================================================
// Bugünün gün/ay'ı ile eşleşen geçmiş yıllardaki anıları gösterir.
// ("Geçen yıl bugün...", "3 yıl önce bugün..."). Eşleşme yoksa nazik
// bir mesaj gösterir. Yatay kaydırılabilir küçük kartlar.
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";

import { RADIUS, SHADOWS } from "@/constants/theme";
import { gunMetni } from "@/constants/tarih";
import type { Memory } from "@/store/memoryStore";
import { usePalet } from "@/store/useThemeStore";

interface BuGunNeOlmustuProps {
  memories: Memory[];
  onPress: (memory: Memory) => void;
}

export function BuGunNeOlmustu({ memories, onPress }: BuGunNeOlmustuProps) {
  const palet = usePalet();

  // Bugünün gün+ay'ı ile eşleşen anılar (en yeni üstte)
  const eslesenler = useMemo(() => {
    const bugun = new Date();
    const ay = bugun.getMonth();
    const gun = bugun.getDate();
    return memories
      .filter((m) => {
        const [, mo, g] = m.date.split("-").map(Number);
        return mo - 1 === ay && g === gun;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [memories]);

  return (
    <View
      className="mb-2 p-4"
      style={{ backgroundColor: palet.yuzey, borderRadius: RADIUS.lg, ...SHADOWS.yumusak }}
    >
      <View className="mb-3 flex-row items-center">
        <Ionicons name="sparkles" size={18} color={palet.secondary} />
        <Text className="ml-2 text-lg font-bold" style={{ color: palet.metin }}>
          Bu gün ne olmuştu?
        </Text>
      </View>

      {eslesenler.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-3">
            {eslesenler.map((m) => (
              <Pressable key={m.id} onPress={() => onPress(m)} style={{ width: 160 }}>
                <Image
                  source={{ uri: m.photoUri }}
                  style={{ width: 160, height: 120, borderRadius: RADIUS.md }}
                  resizeMode="cover"
                />
                <Text className="mt-1 text-xs font-semibold" style={{ color: palet.secondary }}>
                  {gunMetni(m.date)}
                </Text>
                {m.note ? (
                  <Text className="text-sm" style={{ color: palet.metin }} numberOfLines={1}>
                    {m.note}
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : (
        <Text style={{ color: palet.metinIkincil }}>
          Bugüne ait geçmiş bir anı yok. Belki bugün yeni bir tane oluşturursunuz? 💕
        </Text>
      )}
    </View>
  );
}
