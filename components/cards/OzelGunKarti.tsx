// ====================================================================
// OzelGunKarti  (Ana ekran kartı #2)
// ====================================================================
// En yakın özel güne geri sayım gösterir.
// Örn: "Yıldönümümüze 12 gün 💕". Gradyan dolgulu vurgu kartıdır.
// ====================================================================

import { Text, View } from "react-native";

import { GradientCard } from "@/components/ui/GradientCard";
import { enYakinOzelGun } from "@/data/ozelGunler";

export function OzelGunKarti() {
  const yakin = enYakinOzelGun();

  if (!yakin) return null;

  // 0 gün kaldıysa "Bugün!" yazısı daha anlamlı
  const kalanMetni =
    yakin.kalan === 0
      ? "Bugün! 🎉"
      : yakin.kalan === 1
        ? "Yarın 💫"
        : `${yakin.kalan} gün`;

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
            {yakin.gun.emoji} {yakin.gun.baslik}
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
