// ====================================================================
// BilgiKarti — tool sonucu mini bilgi şeridi (✅ Takvime eklendi)
// ====================================================================

import { Text, View } from "react-native";

import { RADIUS } from "@/constants/theme";
import type { ChatMessage } from "@/store/chatStore";
import { usePalet } from "@/store/useThemeStore";

interface BilgiKartiProps {
  message: ChatMessage;
}

export function BilgiKarti({ message }: BilgiKartiProps) {
  const palet = usePalet();
  const metin = message.bilgiMetni ?? message.content;

  return (
    <View className="mb-2 items-center px-8">
      <View
        className="rounded-full px-4 py-2"
        style={{
          backgroundColor: palet.yuzeyIkincil,
          borderWidth: 1,
          borderColor: palet.kenarlik,
          borderRadius: RADIUS.full,
        }}
      >
        <Text className="text-center text-xs font-semibold" style={{ color: palet.secondary }}>
          {metin}
        </Text>
      </View>
    </View>
  );
}
