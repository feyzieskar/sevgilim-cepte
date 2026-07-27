// ====================================================================
// MoodSecici — 6 emoji butonu ile ruh hali seçimi
// ====================================================================

import { Pressable, Text, View } from "react-native";

import { MOOD_SECENEKLERI, MoodTipi } from "@/data/moods";
import { RADIUS } from "@/constants/theme";
import { usePalet } from "@/store/useThemeStore";

interface MoodSeciciProps {
  secili?: MoodTipi;
  onChange: (mood: MoodTipi, emoji: string) => void;
  disabled?: boolean;
}

export function MoodSecici({ secili, onChange, disabled }: MoodSeciciProps) {
  const palet = usePalet();

  return (
    <View className="flex-row flex-wrap justify-between" style={{ gap: 10 }}>
      {MOOD_SECENEKLERI.map((m) => {
        const aktif = secili === m.id;
        return (
          <Pressable
            key={m.id}
            disabled={disabled}
            onPress={() => onChange(m.id, m.emoji)}
            style={({ pressed }) => ({
              width: "30%",
              opacity: disabled ? 0.6 : pressed ? 0.85 : 1,
              alignItems: "center",
              paddingVertical: 14,
              borderRadius: RADIUS.lg,
              backgroundColor: aktif ? `${m.renk}44` : palet.yuzeyIkincil,
              borderWidth: aktif ? 2 : 1,
              borderColor: aktif ? m.renk : palet.kenarlik,
            })}
          >
            <Text style={{ fontSize: 32 }}>{m.emoji}</Text>
            <Text
              className="mt-1 text-xs font-semibold"
              style={{ color: aktif ? palet.metin : palet.metinIkincil }}
            >
              {m.etiket}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
