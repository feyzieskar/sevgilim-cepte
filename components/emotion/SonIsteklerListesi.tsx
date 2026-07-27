// ====================================================================
// SonIsteklerListesi — alt bölümlerde mini geçmiş
// ====================================================================

import { Text, View } from "react-native";

import { RADIUS } from "@/constants/theme";
import {
  EmotionEvent,
  emotionGecmisMetni,
  EmotionType,
  saatFormat,
} from "@/store/emotionStore";
import { useAuthStore } from "@/store/authStore";
import { usePalet } from "@/store/useThemeStore";

interface SonIsteklerListesiProps {
  events: EmotionEvent[];
  type: EmotionType;
  baslik?: string;
  limit?: number;
}

export function SonIsteklerListesi({
  events,
  type,
  baslik = "Son istekler",
  limit = 5,
}: SonIsteklerListesiProps) {
  const palet = usePalet();
  const userId = useAuthStore((s) => s.user?.id);

  const filtreli = events.filter((e) => e.type === type).slice(0, limit);

  if (filtreli.length === 0) return null;

  return (
    <View
      className="mt-6 px-4 py-4"
      style={{
        backgroundColor: palet.yuzey,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: palet.kenarlik,
      }}
    >
      <Text className="mb-3 text-sm font-bold" style={{ color: palet.metinIkincil }}>
        {baslik}
      </Text>
      {filtreli.map((e) => (
        <View key={e.id} className="mb-2 flex-row items-start gap-2">
          <Text className="text-xs font-semibold" style={{ color: palet.secondary }}>
            {saatFormat(e.createdAt)}
          </Text>
          <Text className="flex-1 text-sm" style={{ color: palet.metin }}>
            {emotionGecmisMetni(e, userId)}
          </Text>
        </View>
      ))}
    </View>
  );
}
