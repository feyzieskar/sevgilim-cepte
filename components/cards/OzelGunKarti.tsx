// ====================================================================
// OzelGunKarti  (Ana ekran kartı #2)
// ====================================================================
// En yakın özel güne geri sayım gösterir. İki kaynağı birleştirir:
//   1) Sabit, her yıl tekrar eden özel günler (yıldönümü, doğum günü...)
//   2) Takvime eklenen "Özel Gün" (ozel_gun) kategorili etkinlikler
// Böylece takvime yeni bir özel gün eklenince sayaç anında güncellenir.
// ====================================================================

import { useMemo } from "react";
import { Text, View } from "react-native";

import { GradientCard } from "@/components/ui/GradientCard";
import { bugunISO, isoToDate } from "@/constants/tarih";
import { enYakinOzelGun, kalanGun } from "@/data/ozelGunler";
import { useCalendarStore } from "@/store/calendarStore";

interface Aday {
  baslik: string;
  emoji: string;
  kalan: number;
}

export function OzelGunKarti() {
  const events = useCalendarStore((s) => s.events);

  const yakin = useMemo<Aday | null>(() => {
    const bugun = new Date();
    const adaylar: Aday[] = [];

    // 1) Tekrar eden özel günler
    const tekrar = enYakinOzelGun(bugun);
    if (tekrar) {
      adaylar.push({
        baslik: tekrar.gun.baslik,
        emoji: tekrar.gun.emoji,
        kalan: tekrar.kalan,
      });
    }

    // 2) Takvimdeki "özel gün" kategorili, bugünden itibaren olan etkinlikler
    const buISO = bugunISO(bugun);
    for (const e of events) {
      if (e.category !== "ozel_gun" || e.date < buISO) continue;
      adaylar.push({
        baslik: e.title,
        emoji: "⭐",
        kalan: kalanGun(isoToDate(e.date), bugun),
      });
    }

    if (adaylar.length === 0) return null;
    adaylar.sort((a, b) => a.kalan - b.kalan);
    return adaylar[0];
  }, [events]);

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
            {yakin.emoji} {yakin.baslik}
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
