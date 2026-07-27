// ====================================================================
// SevmeSebebiKarti  (Ana ekran kartı #5)
// ====================================================================
// "Bugün Seni Sevme Sebebim": her gün listeden sıralı bir sebep gösterir.
// Liste = yerleşik sebepler (data/sevmeSebepleri.ts) + çiftin Supabase'e
// eklediği ÖZEL sebepler (love_reasons, partnerle ortak). Kalbe basınca
// rastgele sebep gelir; kalem ikonuyla özel sebepler eklenip silinebilir.
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { GradientCard } from "@/components/ui/GradientCard";
import { gununElemaniniSec } from "@/constants/gunlukSecim";
import { SEVME_SEBEPLERI } from "@/data/sevmeSebepleri";
import { useLoveReasonStore } from "@/store/loveReasonStore";

export function SevmeSebebiKarti() {
  const router = useRouter();
  const ozelSebepler = useLoveReasonStore((s) => s.reasons);

  // Yerleşik + özel sebepler birleşik liste
  const tumSebepler = useMemo(
    () => [...SEVME_SEBEPLERI, ...ozelSebepler.map((r) => r.text)],
    [ozelSebepler]
  );

  // Varsayılan: bugüne karşılık gelen sebep
  const [sebep, setSebep] = useState(
    () => gununElemaniniSec(SEVME_SEBEPLERI) ?? ""
  );

  const yeniSebep = () => {
    if (tumSebepler.length === 0) return;
    const rastgele =
      tumSebepler[Math.floor(Math.random() * tumSebepler.length)];
    setSebep(rastgele);
  };

  return (
    <GradientCard
      gradient
      gradientTipi="gunbatimi"
      onPress={() => router.push("/sevme-sebepleri")}
    >
      <View className="flex-row items-center justify-between">
        <Text
          className="text-sm font-semibold uppercase text-white"
          style={{ letterSpacing: 1, opacity: 0.95 }}
        >
          Bugün Seni Sevme Sebebim
        </Text>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => router.push("/sevme-sebepleri")}
            hitSlop={10}
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
          >
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
          </Pressable>
          <Pressable
            onPress={yeniSebep}
            hitSlop={10}
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
          >
            <Ionicons name="heart" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <Text className="mt-3 text-xl font-semibold leading-7 text-white">
        {sebep}
      </Text>

      <Text className="mt-3 text-xs text-white" style={{ opacity: 0.85 }}>
        Tüm sebepleri görmek için dokun · kalbe basınca yeni sebep 💗
      </Text>
    </GradientCard>
  );
}
