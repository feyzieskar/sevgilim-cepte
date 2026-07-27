// ====================================================================
// DuyguSekmeleri — üst segmented control (3 alt bölüm)
// ====================================================================

import { Pressable, Text, View } from "react-native";

import { RADIUS, SHADOWS } from "@/constants/theme";
import { usePalet } from "@/store/useThemeStore";

export type DuyguAltBolum = "karnim" | "sevgi" | "surpriz";

const SEKMELER: { id: DuyguAltBolum; etiket: string; emoji: string }[] = [
  { id: "karnim", etiket: "Karnım Acıktı", emoji: "🍽️" },
  { id: "sevgi", etiket: "Sevgi Saati", emoji: "💕" },
  { id: "surpriz", etiket: "Sürprizler", emoji: "🎁" },
];

interface DuyguSekmeleriProps {
  secili: DuyguAltBolum;
  onChange: (bolum: DuyguAltBolum) => void;
}

export function DuyguSekmeleri({ secili, onChange }: DuyguSekmeleriProps) {
  const palet = usePalet();

  return (
    <View
      className="mx-5 flex-row rounded-2xl p-1"
      style={{
        backgroundColor: palet.yuzeyIkincil,
        borderWidth: 1,
        borderColor: palet.kenarlik,
        ...SHADOWS.yumusak,
      }}
    >
      {SEKMELER.map((s) => {
        const aktif = s.id === secili;
        return (
          <Pressable
            key={s.id}
            onPress={() => onChange(s.id)}
            className="flex-1 items-center rounded-xl py-2.5"
            style={{
              backgroundColor: aktif ? palet.primary : "transparent",
            }}
          >
            <Text style={{ fontSize: aktif ? 16 : 14 }}>{s.emoji}</Text>
            <Text
              className="mt-0.5 text-center text-[11px] font-bold"
              style={{ color: aktif ? "#FFFFFF" : palet.metinIkincil }}
              numberOfLines={1}
            >
              {s.etiket}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
