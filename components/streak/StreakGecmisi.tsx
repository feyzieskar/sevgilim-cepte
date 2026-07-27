// ====================================================================
// StreakGecmisi — gün gün mini fotoğraf akışı
// ====================================================================

import { Image, Text, View } from "react-native";

import { tarihKisa } from "@/constants/tarih";
import { RADIUS, SHADOWS } from "@/constants/theme";
import { GunlukOzet } from "@/store/streakStore";
import { usePalet } from "@/store/useThemeStore";

interface StreakGecmisiProps {
  history: GunlukOzet[];
  userId?: string;
}

export function StreakGecmisi({ history, userId }: StreakGecmisiProps) {
  const palet = usePalet();

  if (history.length === 0) {
    return (
      <View
        className="items-center rounded-2xl py-10"
        style={{ backgroundColor: palet.yuzey, ...SHADOWS.yumusak }}
      >
        <Text style={{ color: palet.metinIkincil }}>
          Henüz streak fotoğrafı yok. İlkini gönder! 📸
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-4">
      {history.map((gun) => {
        const benim = gun.photos.find((p) => p.createdBy === userId);
        const partnerin = gun.photos.find((p) => p.createdBy !== userId);

        return (
          <View
            key={gun.date}
            className="rounded-2xl p-4"
            style={{ backgroundColor: palet.yuzey, ...SHADOWS.yumusak }}
          >
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="font-bold" style={{ color: palet.metin }}>
                {tarihKisa(gun.date)}
              </Text>
              <Text
                className="text-sm font-semibold"
                style={{
                  color: gun.tamamlandi ? "#22C55E" : palet.metinIkincil,
                }}
              >
                {gun.tamamlandi ? "✅ Tamamlandı" : "⏳ Eksik"}
              </Text>
            </View>

            <View className="flex-row gap-3">
              <FotoKutusu
                etiket="Sen"
                uri={benim?.photoUrl}
                bosMetin="Gönderilmedi"
              />
              <FotoKutusu
                etiket="Partner"
                uri={partnerin?.photoUrl}
                bosMetin="Bekleniyor"
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function FotoKutusu({
  etiket,
  uri,
  bosMetin,
}: {
  etiket: string;
  uri?: string;
  bosMetin: string;
}) {
  const palet = usePalet();

  return (
    <View className="flex-1">
      <Text
        className="mb-1.5 text-center text-xs font-semibold"
        style={{ color: palet.metinIkincil }}
      >
        {etiket}
      </Text>
      {uri ? (
        <Image
          source={{ uri }}
          className="h-28 w-full rounded-xl"
          style={{ borderRadius: RADIUS.md }}
          resizeMode="cover"
        />
      ) : (
        <View
          className="h-28 items-center justify-center rounded-xl"
          style={{
            backgroundColor: palet.yuzeyIkincil,
            borderRadius: RADIUS.md,
          }}
        >
          <Text className="text-xs" style={{ color: palet.metinIkincil }}>
            {bosMetin}
          </Text>
        </View>
      )}
    </View>
  );
}
