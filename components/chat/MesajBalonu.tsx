// ====================================================================
// MesajBalonu
// ====================================================================
// Tek bir sohbet mesajını çizer.
//  - Feyzi (assistant): solda, pembe/lila gradyan balon, beyaz yazı
//  - Kullanıcı (user): sağda, nötr yüzey balonu
//  - Hata mesajı: solda, soluk nötr balon
// ====================================================================

import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";

import { FeyziAvatar } from "@/components/chat/FeyziAvatar";
import { GRADIENTS, RADIUS } from "@/constants/theme";
import type { ChatMessage } from "@/store/chatStore";
import { usePalet } from "@/store/useThemeStore";

interface MesajBalonuProps {
  message: ChatMessage;
}

export function MesajBalonu({ message }: MesajBalonuProps) {
  const palet = usePalet();
  const kullanici = message.role === "user";

  // Kullanıcı balonu (sağ, nötr)
  if (kullanici) {
    return (
      <View className="mb-3 flex-row justify-end px-4">
        <View
          style={{
            maxWidth: "80%",
            backgroundColor: palet.yuzeyIkincil,
            borderRadius: RADIUS.lg,
            borderBottomRightRadius: 6,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        >
          <Text className="text-base" style={{ color: palet.metin }}>
            {message.content}
          </Text>
        </View>
      </View>
    );
  }

  // Feyzi balonu (sol). Hata ise gradyan yerine soluk nötr balon.
  return (
    <View className="mb-3 flex-row items-end px-4">
      <View className="mr-2">
        <FeyziAvatar size={32} />
      </View>

      {message.hata ? (
        <View
          style={{
            maxWidth: "78%",
            backgroundColor: palet.yuzeyIkincil,
            borderRadius: RADIUS.lg,
            borderBottomLeftRadius: 6,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: palet.kenarlik,
          }}
        >
          <Text className="text-base" style={{ color: palet.metinIkincil }}>
            {message.content}
          </Text>
        </View>
      ) : (
        <LinearGradient
          colors={GRADIENTS.romantik}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            maxWidth: "78%",
            borderRadius: RADIUS.lg,
            borderBottomLeftRadius: 6,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        >
          <Text className="text-base text-white">{message.content}</Text>
        </LinearGradient>
      )}
    </View>
  );
}
