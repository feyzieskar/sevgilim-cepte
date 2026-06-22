// ====================================================================
// KategoriSecici
// ====================================================================
// Etkinlik formunda kategori seçmek için renkli "chip" satırı.
// Seçili kategori kendi renginde dolu, diğerleri soluk görünür.
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { EventCategory, KATEGORI_LISTESI } from "@/constants/kategoriler";
import { usePalet } from "@/store/useThemeStore";

interface KategoriSeciciProps {
  secili: EventCategory;
  onChange: (kategori: EventCategory) => void;
}

export function KategoriSecici({ secili, onChange }: KategoriSeciciProps) {
  const palet = usePalet();

  return (
    <View className="flex-row flex-wrap gap-2">
      {KATEGORI_LISTESI.map((k) => {
        const aktif = k.anahtar === secili;
        return (
          <Pressable
            key={k.anahtar}
            onPress={() => onChange(k.anahtar)}
            className="flex-row items-center rounded-full px-4 py-2"
            style={{
              backgroundColor: aktif ? k.renk : palet.yuzeyIkincil,
              borderWidth: 1,
              borderColor: aktif ? k.renk : palet.kenarlik,
            }}
          >
            <Ionicons
              name={k.ikon}
              size={16}
              color={aktif ? "#FFFFFF" : k.renk}
            />
            <Text
              className="ml-2 text-sm font-semibold"
              style={{ color: aktif ? "#FFFFFF" : palet.metin }}
            >
              {k.etiket}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
