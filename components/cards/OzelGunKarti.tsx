// ====================================================================
// OzelGunKarti  (Ana ekran kartı #2)
// ====================================================================
// En yakın özel güne geri sayım gösterir. Kaynak: her yıl tekrar eden
// özel günler (Supabase special_days — yıldönümü, doğum günü...).
// Partner bir özel gün ekleyince/düzenleyince sayaç anında güncellenir.
// ====================================================================

import { useMemo } from "react";
import { Text, View } from "react-native";

import { GradientCard } from "@/components/ui/GradientCard";
import { enYakinOzelGun } from "@/data/ozelGunler";
import { useOzelGunStore } from "@/store/ozelGunStore";

interface Aday {
  baslik: string;
  emoji: string;
  kalan: number;
}

export function OzelGunKarti() {
  const ozelGunler = useOzelGunStore((s) => s.ozelGunler);

  const yakin = useMemo<Aday | null>(() => {
    const tekrar = enYakinOzelGun(ozelGunler);
    if (!tekrar) return null;
    return {
      baslik: tekrar.gun.baslik,
      emoji: tekrar.gun.emoji,
      kalan: tekrar.kalan,
    };
  }, [ozelGunler]);

  if (!yakin) return null;

  // 0 gün kaldıysa "Bugün!" yazısı daha anlamlı
  const kalanMetni =
    yakin.kalan === 0 ? "Bugün! 🎉" : yakin.kalan === 1 ? "Yarın 💫" : `${yakin.kalan} gün`;

  return (
    <GradientCard gradient gradientTipi="romantik">
      <Text
        className="text-sm font-semibold uppercase text-white"
        style={{ letterSpacing: 1, opacity: 0.9 }}
      >
        Sonraki Özel Gün
      </Text>

      <View className="mt-3 flex-row items-end justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-2xl font-bold text-white">
            {yakin.emoji} {yakin.baslik}
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row items-baseline">
        <Text className="text-5xl font-extrabold text-white">{kalanMetni}</Text>
      </View>
      {yakin.kalan > 1 ? (
        <Text className="mt-1 text-base text-white" style={{ opacity: 0.9 }}>
          kaldı 💕
        </Text>
      ) : null}
    </GradientCard>
  );
}
