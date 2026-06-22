// ====================================================================
// FeyziAiKarti  (Ana ekran kartı #4)
// ====================================================================
// Tıklanınca Feyzi AI sohbet sekmesine yönlendirir.
// Gradyan dolgulu, çağrı niteliğinde (call-to-action) bir karttır.
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";

import { GradientCard } from "@/components/ui/GradientCard";

export function FeyziAiKarti() {
  const router = useRouter();

  return (
    <GradientCard
      gradient
      gradientTipi="sakin"
      onPress={() => router.push("/feyzi-ai")}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-xl font-bold text-white">Feyzi AI'a Sor 💬</Text>
          <Text className="mt-1 text-base text-white" style={{ opacity: 0.9 }}>
            Aklındakini Feyzi'ye sor, seni dinlesin.
          </Text>
        </View>
        <View
          className="h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
        >
          <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
        </View>
      </View>
    </GradientCard>
  );
}
