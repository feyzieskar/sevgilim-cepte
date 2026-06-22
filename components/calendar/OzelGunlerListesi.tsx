// ====================================================================
// OzelGunlerListesi
// ====================================================================
// "Bize Özel Günler" görünümü. İki kaynağı birleştirir:
//   1) data/ozelGunler.ts içindeki HER YIL tekrar eden özel günler
//      (tanışma yıldönümü, doğum günleri...)
//   2) Takvim store'unda kategorisi 'ozel_gun' olan etkinlikler
// Her biri için "kaç gün kaldı" bilgisini gösterir, yakına göre sıralar.
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Text, View } from "react-native";

import { KATEGORILER } from "@/constants/kategoriler";
import { RADIUS, SHADOWS } from "@/constants/theme";
import { isoToDate, tarihKisa } from "@/constants/tarih";
import {
  enYakinOzelGun,
  kalanGun,
  OZEL_GUNLER,
  sonrakiTarih,
} from "@/data/ozelGunler";
import type { CalendarEvent } from "@/store/calendarStore";
import { usePalet } from "@/store/useThemeStore";

// Ekranda gösterilecek birleşik öğe
interface OzelGunOgesi {
  id: string;
  baslik: string;
  emoji: string;
  kalan: number;
  tarihMetni: string;
  tekrarEden: boolean;
}

interface OzelGunlerListesiProps {
  events: CalendarEvent[];
}

export function OzelGunlerListesi({ events }: OzelGunlerListesiProps) {
  const palet = usePalet();
  const ozelRenk = KATEGORILER.ozel_gun.renk;

  const ogeler = useMemo<OzelGunOgesi[]>(() => {
    const bugun = new Date();

    // 1) Tekrar eden özel günler
    const tekrarEdenler: OzelGunOgesi[] = OZEL_GUNLER.map((g) => {
      const tarih = sonrakiTarih(g, bugun);
      return {
        id: `tekrar-${g.id}`,
        baslik: g.baslik,
        emoji: g.emoji,
        kalan: kalanGun(tarih, bugun),
        tarihMetni: tarihKisa(
          `${tarih.getFullYear()}-${String(tarih.getMonth() + 1).padStart(2, "0")}-${String(tarih.getDate()).padStart(2, "0")}`
        ),
        tekrarEden: true,
      };
    });

    // 2) Store'daki 'ozel_gun' etkinlikleri (yalnızca yaklaşanlar)
    const storeOgeleri: OzelGunOgesi[] = events
      .filter((e) => e.category === "ozel_gun")
      .map((e) => ({
        id: e.id,
        baslik: e.title,
        emoji: "⭐",
        kalan: kalanGun(isoToDate(e.date), bugun),
        tarihMetni: tarihKisa(e.date),
        tekrarEden: false,
      }))
      .filter((o) => o.kalan >= 0);

    return [...tekrarEdenler, ...storeOgeleri].sort((a, b) => a.kalan - b.kalan);
  }, [events]);

  const enYakin = enYakinOzelGun();

  return (
    <View className="gap-3">
      {ogeler.map((o) => {
        const vurgu = enYakin && o.id === `tekrar-${enYakin.gun.id}`;
        return (
          <View
            key={o.id}
            className="flex-row items-center p-4"
            style={{
              backgroundColor: palet.yuzey,
              borderRadius: RADIUS.md,
              borderWidth: vurgu ? 2 : 0,
              borderColor: ozelRenk,
              ...SHADOWS.yumusak,
            }}
          >
            {/* Emoji rozeti */}
            <View
              className="mr-3 h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: ozelRenk + "22" }}
            >
              <Text className="text-xl">{o.emoji}</Text>
            </View>

            {/* Başlık + tarih */}
            <View className="flex-1">
              <Text className="text-base font-bold" style={{ color: palet.metin }}>
                {o.baslik}
              </Text>
              <View className="mt-0.5 flex-row items-center">
                <Ionicons name="calendar-outline" size={13} color={palet.metinIkincil} />
                <Text className="ml-1 text-xs" style={{ color: palet.metinIkincil }}>
                  {o.tarihMetni}
                  {o.tekrarEden ? " · her yıl" : ""}
                </Text>
              </View>
            </View>

            {/* Geri sayım */}
            <View className="items-end">
              <Text className="text-2xl font-extrabold" style={{ color: ozelRenk }}>
                {o.kalan === 0 ? "Bugün" : o.kalan}
              </Text>
              {o.kalan > 0 ? (
                <Text className="text-xs" style={{ color: palet.metinIkincil }}>
                  gün kaldı
                </Text>
              ) : (
                <Text className="text-xs" style={{ color: ozelRenk }}>
                  🎉
                </Text>
              )}
            </View>
          </View>
        );
      })}

      {ogeler.length === 0 ? (
        <Text className="mt-8 text-center" style={{ color: palet.metinIkincil }}>
          Henüz özel gün yok. Yeni bir özel gün eklemek için takvimden
          "Özel Gün" kategorisinde bir etkinlik oluştur 💜
        </Text>
      ) : null}
    </View>
  );
}
