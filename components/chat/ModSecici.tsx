// ====================================================================
// ModSecici
// ====================================================================
// Sohbet modunu seçtiren yatay şerit. 4 aktif metin modu:
// Normal / Moral / Plan / Anı. Sesli ve Video modları "Yakında"
// etiketiyle PASİF gösterilir (sonraki fazda açılacak).
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { FeyziMode, MODE_META } from "@/constants/feyziPrompts";
import { usePalet } from "@/store/useThemeStore";

type IkonAdi = ComponentProps<typeof Ionicons>["name"];

interface ModSeciciProps {
  secili: FeyziMode;
  onChange: (mode: FeyziMode) => void;
}

const AKTIF_MODLAR: FeyziMode[] = ["normal", "moral", "plan", "ani"];

// Sonraki fazda açılacak pasif modlar
const YAKINDA_MODLAR: { etiket: string; ikon: IkonAdi }[] = [
  { etiket: "Sesli", ikon: "mic" },
  { etiket: "Video", ikon: "videocam" },
];

export function ModSecici({ secili, onChange }: ModSeciciProps) {
  const palet = usePalet();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingVertical: 4 }}
    >
      {AKTIF_MODLAR.map((m) => {
        const meta = MODE_META[m];
        const aktif = m === secili;
        return (
          <Pressable
            key={m}
            onPress={() => onChange(m)}
            className="flex-row items-center rounded-full px-4 py-2"
            style={{
              backgroundColor: aktif ? palet.primary : palet.yuzeyIkincil,
              borderWidth: 1,
              borderColor: aktif ? palet.primary : palet.kenarlik,
            }}
          >
            <Ionicons
              name={meta.ikon as IkonAdi}
              size={15}
              color={aktif ? "#FFFFFF" : palet.metinIkincil}
            />
            <Text
              className="ml-1.5 text-sm font-semibold"
              style={{ color: aktif ? "#FFFFFF" : palet.metin }}
            >
              {meta.etiket}
            </Text>
          </Pressable>
        );
      })}

      {/* Pasif "Yakında" modları */}
      {YAKINDA_MODLAR.map((m) => (
        <View
          key={m.etiket}
          className="flex-row items-center rounded-full px-4 py-2"
          style={{
            backgroundColor: palet.yuzeyIkincil,
            borderWidth: 1,
            borderColor: palet.kenarlik,
            opacity: 0.5,
          }}
        >
          <Ionicons name={m.ikon} size={15} color={palet.metinIkincil} />
          <Text className="ml-1.5 text-sm font-semibold" style={{ color: palet.metinIkincil }}>
            {m.etiket}
          </Text>
          <View
            className="ml-2 rounded-full px-2 py-0.5"
            style={{ backgroundColor: palet.kenarlik }}
          >
            <Text className="text-[10px] font-bold" style={{ color: palet.metinIkincil }}>
              Yakında
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
