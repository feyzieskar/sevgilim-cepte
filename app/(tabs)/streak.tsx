import { Flame } from "lucide-react-native";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EkranBasligi } from "@/components/ui/EkranBasligi";
import { RADIUS, SHADOWS } from "@/constants/theme";
import { usePalet } from "@/store/useThemeStore";

export default function StreakEkrani() {
  const palet = usePalet();

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: palet.arkaplan }}
    >
      <View className="px-5 pt-2">
        <EkranBasligi
          baslik="Streak"
          altBaslik="Birlikte kurduğunuz ritim burada yaşayacak 🔥"
        />
      </View>

      <View className="flex-1 px-5 pb-8 pt-6">
        <View
          className="flex-1 items-center justify-center px-8"
          style={{
            backgroundColor: palet.yuzey,
            borderRadius: RADIUS.lg,
            ...SHADOWS.yumusak,
          }}
        >
          <View
            className="h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: `${palet.primary}18` }}
          >
            <Flame size={38} color={palet.primary} strokeWidth={2.2} />
          </View>
          <Text
            className="mt-5 text-center text-2xl font-bold"
            style={{ color: palet.metin }}
          >
            Streak yakında burada
          </Text>
          <Text
            className="mt-3 text-center text-base leading-6"
            style={{ color: palet.metinIkincil }}
          >
            Günlük bağınızı, küçük ritüellerinizi ve romantik serinizi burada
            takip edeceğiz. Şimdilik bu ekran hazırlanıyor. 🔥
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
