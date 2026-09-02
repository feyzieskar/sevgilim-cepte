// ====================================================================
// YakindaEkran (placeholder / iskelet ekran)
// ====================================================================
// Henüz geliştirilmemiş sekmeler için kullanılan ortak iskelet ekran.
// Büyük bir ikon, başlık ve "yakında" açıklaması gösterir.
// Her sekme sonraki adımlarda gerçek içerikle değiştirilecek.
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EkranBasligi } from "@/components/ui/EkranBasligi";
import { usePalet } from "@/store/useThemeStore";

interface YakindaEkranProps {
  baslik: string;
  altBaslik?: string;
  ikon: ComponentProps<typeof Ionicons>["name"];
  aciklama: string;
}

export function YakindaEkran({ baslik, altBaslik, ikon, aciklama }: YakindaEkranProps) {
  const palet = usePalet();

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: palet.arkaplan }}>
      <View className="px-5 pt-2">
        <EkranBasligi baslik={baslik} altBaslik={altBaslik} />
      </View>

      <View className="flex-1 items-center justify-center px-10">
        <View
          className="mb-6 h-24 w-24 items-center justify-center rounded-full"
          style={{ backgroundColor: palet.yuzeyIkincil }}
        >
          <Ionicons name={ikon} size={44} color={palet.primary} />
        </View>
        <Text className="text-center text-lg font-semibold" style={{ color: palet.metin }}>
          {aciklama}
        </Text>
        <Text className="mt-2 text-center text-base" style={{ color: palet.metinIkincil }}>
          Bu bölüm yakında geliyor 💕
        </Text>
      </View>
    </SafeAreaView>
  );
}
