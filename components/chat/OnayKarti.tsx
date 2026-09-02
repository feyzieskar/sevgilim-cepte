// ====================================================================
// OnayKarti — kalıcı işlem için "Onaylıyor musun?" sohbet kartı
// ====================================================================

import { Pressable, Text, View } from "react-native";

import { RADIUS, SHADOWS } from "@/constants/theme";
import type { ChatMessage } from "@/store/chatStore";
import { usePalet } from "@/store/useThemeStore";

interface OnayKartiProps {
  message: ChatMessage;
  onOnayla: () => void;
  onReddet: () => void;
  disabled?: boolean;
}

export function OnayKarti({ message, onOnayla, onReddet, disabled }: OnayKartiProps) {
  const palet = usePalet();
  const durum = message.onayDurum ?? "bekliyor";
  const bekliyor = durum === "bekliyor";

  return (
    <View className="mb-3 flex-row items-end px-4">
      <View
        style={{
          maxWidth: "88%",
          backgroundColor: palet.yuzey,
          borderRadius: RADIUS.lg,
          borderBottomLeftRadius: 6,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderWidth: 1,
          borderColor: palet.primary,
          ...SHADOWS.yumusak,
        }}
      >
        <Text className="text-xs font-bold" style={{ color: palet.primary }}>
          Onaylıyor musun?
        </Text>
        <Text className="mt-1.5 text-sm" style={{ color: palet.metin }}>
          {message.content}
        </Text>

        {bekliyor ? (
          <View className="mt-3 flex-row gap-2">
            <Pressable
              onPress={onOnayla}
              disabled={disabled}
              className="flex-1 items-center rounded-xl py-2.5"
              style={{ backgroundColor: palet.primary, opacity: disabled ? 0.5 : 1 }}
            >
              <Text className="text-sm font-bold text-white">Evet 💕</Text>
            </Pressable>
            <Pressable
              onPress={onReddet}
              disabled={disabled}
              className="flex-1 items-center rounded-xl py-2.5"
              style={{
                backgroundColor: palet.yuzeyIkincil,
                borderWidth: 1,
                borderColor: palet.kenarlik,
                opacity: disabled ? 0.5 : 1,
              }}
            >
              <Text className="text-sm font-semibold" style={{ color: palet.metinIkincil }}>
                Hayır
              </Text>
            </Pressable>
          </View>
        ) : (
          <Text className="mt-2 text-xs font-semibold" style={{ color: palet.metinIkincil }}>
            {durum === "onaylandi" ? "Onaylandı ✅" : "Vazgeçildi"}
          </Text>
        )}
      </View>
    </View>
  );
}
