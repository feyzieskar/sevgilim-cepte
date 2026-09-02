// ====================================================================
// GununMesajiKarti  (Ana ekran kartı #3)
// ====================================================================
// Her gün otomatik değişen tatlı bir mesaj gösterir.
// Şimdilik önceden tanımlı listeden seçilir; ileride OpenAI ile
// dinamik üretim opsiyonu eklenecek.
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { GradientCard } from "@/components/ui/GradientCard";
import { gununElemaniniSec } from "@/constants/gunlukSecim";
import { GUNUN_MESAJLARI } from "@/data/gununMesajlari";
import { usePalet } from "@/store/useThemeStore";

export function GununMesajiKarti() {
  const palet = usePalet();
  const mesaj = gununElemaniniSec(GUNUN_MESAJLARI) ?? "";

  return (
    <GradientCard>
      <View className="flex-row items-center">
        <Ionicons name="chatbubble-ellipses" size={20} color={palet.secondary} />
        <Text
          className="ml-2 text-sm font-semibold uppercase"
          style={{ color: palet.metinIkincil, letterSpacing: 1 }}
        >
          Günün Mesajı
        </Text>
      </View>

      <Text className="mt-3 text-xl font-semibold leading-7" style={{ color: palet.metin }}>
        “{mesaj}”
      </Text>
    </GradientCard>
  );
}
