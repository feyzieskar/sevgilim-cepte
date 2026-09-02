// ====================================================================
// EtkinlikKarti  (Ana ekran kartı #1)
// ====================================================================
// Bugüne ait takvim etkinliğini gösterir. Veriler artık Supabase tabanlı
// calendarStore'dan gelir; takvimde etkinlik ekleyince bu kart da anında
// güncellenir. Etkinlik yoksa nazik bir boş durum mesajı gösterir.
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Text, View } from "react-native";

import { GradientCard } from "@/components/ui/GradientCard";
import { kategoriBilgisi } from "@/constants/kategoriler";
import { bugunISO } from "@/constants/tarih";
import { useCalendarStore } from "@/store/calendarStore";
import { usePalet } from "@/store/useThemeStore";

export function EtkinlikKarti() {
  const palet = usePalet();
  const events = useCalendarStore((s) => s.events);

  // Bugünün ilk etkinliği (saate göre sıralı)
  const etkinlik = useMemo(() => {
    const bugun = bugunISO();
    return events
      .filter((e) => e.date === bugun)
      .sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      })[0];
  }, [events]);

  const kategori = etkinlik ? kategoriBilgisi(etkinlik.category) : null;

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

      {etkinlik && kategori ? (
        <View className="mt-3">
          <Text className="text-xl font-bold" style={{ color: palet.metin }}>
            {etkinlik.title}
          </Text>
          <View className="mt-2 flex-row items-center">
            {etkinlik.time ? (
              <View className="mr-3 flex-row items-center">
                <Ionicons name="time-outline" size={16} color={palet.metinIkincil} />
                <Text className="ml-1" style={{ color: palet.metinIkincil }}>
                  {etkinlik.time}
                </Text>
              </View>
            ) : null}
            <View
              className="rounded-full px-3 py-1"
              style={{ backgroundColor: kategori.renk + "22" }}
            >
              <Text className="text-xs font-semibold" style={{ color: kategori.renk }}>
                {kategori.etiket}
              </Text>
            </View>
          </View>
          {etkinlik.note ? (
            <Text className="mt-2" style={{ color: palet.metinIkincil }}>
              {etkinlik.note}
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
