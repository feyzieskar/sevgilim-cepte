// ====================================================================
// SevmeSebebiKarti  (Ana ekran kartı #5)
// ====================================================================
// "Bugün Seni Sevme Sebebim": her gün listeden sıralı bir sebep
// gösterir. Kullanıcı kalp ikonuna basarak "yeni bir sebep" görebilir
// (rastgele) — küçük bir etkileşim katmak için.
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { GradientCard } from "@/components/ui/GradientCard";
import { gununElemaniniSec } from "@/constants/gunlukSecim";
import { SEVME_SEBEPLERI } from "@/data/sevmeSebepleri";
import { usePalet } from "@/store/useThemeStore";

export function SevmeSebebiKarti() {
  const palet = usePalet();

  // Varsayılan: bugüne karşılık gelen sebep
  const gununSebebi = gununElemaniniSec(SEVME_SEBEPLERI) ?? "";
  const [sebep, setSebep] = useState(gununSebebi);

  // Kalbe basınca rastgele başka bir sebep göster
  const yeniSebep = () => {
    const rastgele =
      SEVME_SEBEPLERI[Math.floor(Math.random() * SEVME_SEBEPLERI.length)];
    setSebep(rastgele);
  };

  return (
    <GradientCard gradient gradientTipi="gunbatimi">
      <View className="flex-row items-center justify-between">
        <Text
          className="text-sm font-semibold uppercase text-white"
          style={{ letterSpacing: 1, opacity: 0.95 }}
        >
          Bugün Seni Sevme Sebebim
        </Text>
        <Pressable
          onPress={yeniSebep}
          hitSlop={10}
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
        >
          <Ionicons name="heart" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <Text className="mt-3 text-xl font-semibold leading-7 text-white">
        {sebep}
      </Text>

      <Text className="mt-3 text-xs text-white" style={{ opacity: 0.85 }}>
        Yeni bir sebep için kalbe dokun 💗
      </Text>
    </GradientCard>
  );
}
