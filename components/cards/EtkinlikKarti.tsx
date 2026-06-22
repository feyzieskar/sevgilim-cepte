// ====================================================================
// EtkinlikKarti  (Ana ekran kartı #1)
// ====================================================================
// Bugüne ait takvim etkinliğini gösterir. Etkinlik yoksa nazik bir
// boş durum mesajı gösterir: "Bugün planımız yok 💭".
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { GradientCard } from "@/components/ui/GradientCard";
import { KATEGORI_RENKLERI } from "@/constants/theme";
import { bugunISO, gununEtkinlikleri } from "@/data/etkinlikler";
import { usePalet } from "@/store/useThemeStore";

export function EtkinlikKarti() {
  const palet = usePalet();
  const etkinlikler = gununEtkinlikleri(bugunISO());
  const etkinlik = etkinlikler[0]; // şimdilik ilk etkinliği gösteriyoruz

  return (
    <GradientCard>
      <View className="flex-row items-center">
        <View
          className="mr-3 h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: palet.yuzeyIkincil }}
        >
          <Ionicons name="today" size={20} color={palet.primary} />
        </View>
        <Text
          className="text-sm font-semibold uppercase"
          style={{ color: palet.metinIkincil, letterSpacing: 1 }}
        >
          Bugünkü Planımız
        </Text>
      </View>

      {etkinlik ? (
        <View className="mt-3">
          <Text className="text-xl font-bold" style={{ color: palet.metin }}>
            {etkinlik.baslik}
          </Text>
          <View className="mt-2 flex-row items-center">
            {etkinlik.saat ? (
              <View className="mr-3 flex-row items-center">
                <Ionicons name="time-outline" size={16} color={palet.metinIkincil} />
                <Text className="ml-1" style={{ color: palet.metinIkincil }}>
                  {etkinlik.saat}
                </Text>
              </View>
            ) : null}
            <View
              className="rounded-full px-3 py-1"
              style={{ backgroundColor: KATEGORI_RENKLERI[etkinlik.kategori] + "22" }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: KATEGORI_RENKLERI[etkinlik.kategori] }}
              >
                {etkinlik.kategori}
              </Text>
            </View>
          </View>
          {etkinlik.not ? (
            <Text className="mt-2" style={{ color: palet.metinIkincil }}>
              {etkinlik.not}
            </Text>
          ) : null}
        </View>
      ) : (
        <Text className="mt-3 text-lg" style={{ color: palet.metinIkincil }}>
          Bugün planımız yok 💭
        </Text>
      )}
    </GradientCard>
  );
}
