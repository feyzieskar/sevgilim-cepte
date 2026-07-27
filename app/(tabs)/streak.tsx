// ====================================================================
// STREAK SEKMESİ — Günlük fotoğraf serisi
// ====================================================================

import { useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera } from "lucide-react-native";

import { StreakGecmisi } from "@/components/streak/StreakGecmisi";
import { StreakSayaci } from "@/components/streak/StreakSayaci";
import { EkranBasligi } from "@/components/ui/EkranBasligi";
import { RADIUS, SHADOWS } from "@/constants/theme";
import { galeridenSec, kameradanCek } from "@/services/media";
import { useAuthStore } from "@/store/authStore";
import {
  benBugunGonderdimMi,
  bugunTamamlandiMi,
  partnerBugunGonderdiMi,
  useStreakStore,
} from "@/store/streakStore";
import { usePalet } from "@/store/useThemeStore";

export default function StreakEkrani() {
  const palet = usePalet();
  const userId = useAuthStore((s) => s.user?.id);

  const todayPhotos = useStreakStore((s) => s.todayPhotos);
  const history = useStreakStore((s) => s.history);
  const streak = useStreakStore((s) => s.streak);
  const partnerId = useStreakStore((s) => s.partnerId);
  const loading = useStreakStore((s) => s.loading);
  const yuklendiMi = useStreakStore((s) => s.yuklendiMi);
  const gonderiliyor = useStreakStore((s) => s.gonderiliyor);
  const yukle = useStreakStore((s) => s.yukle);
  const sendStreakPhoto = useStreakStore((s) => s.sendStreakPhoto);

  useEffect(() => {
    if (!yuklendiMi) void yukle();
  }, [yuklendiMi, yukle]);

  const benGonderdim = benBugunGonderdimMi(todayPhotos, userId);
  const partnerGonderdi = partnerBugunGonderdiMi(todayPhotos, partnerId);
  const bugunTamam = bugunTamamlandiMi(todayPhotos, userId, partnerId);

  const benimFoto = todayPhotos.find((p) => p.createdBy === userId);
  const partnerFoto = todayPhotos.find((p) => p.createdBy === partnerId);

  const fotoGonder = useCallback(async () => {
    if (gonderiliyor) return;

    Alert.alert("Fotoğraf Gönder", "Nereden seçmek istersin?", [
      {
        text: "Kamera",
        onPress: async () => {
          const secim = await kameradanCek();
          if (!secim?.base64) return;
          const sonuc = await sendStreakPhoto(secim.uri, secim.base64);
          if (!sonuc) {
            Alert.alert(
              "Gönderilemedi",
              "Fotoğraf yüklenirken bir sorun oluştu. Tekrar dene."
            );
          }
        },
      },
      {
        text: "Galeri",
        onPress: async () => {
          const secim = await galeridenSec();
          if (!secim?.base64) return;
          const sonuc = await sendStreakPhoto(secim.uri, secim.base64);
          if (!sonuc) {
            Alert.alert(
              "Gönderilemedi",
              "Fotoğraf yüklenirken bir sorun oluştu. Tekrar dene."
            );
          }
        },
      },
      { text: "Vazgeç", style: "cancel" },
    ]);
  }, [gonderiliyor, sendStreakPhoto]);

  const uyariMetni = (() => {
    if (!partnerId) {
      return "Partner eşleşmesi yapılmadan streak başlayamaz.";
    }
    if (!benGonderdim) {
      return "Serini kaybetme! Bugün henüz göndermedin 🔥";
    }
    if (!partnerGonderdi) {
      return "Sen gönderdin ✅ Partner'in fotoğrafını bekliyoruz ⏳";
    }
    if (bugunTamam) {
      return "Bugün tamamlandı! Harikasınız 💕";
    }
    return null;
  })();

  const streakSifirMi =
    (streak?.currentStreak ?? 0) === 0 &&
    !!partnerId &&
    history.some((g) => g.tamamlandi);

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: palet.arkaplan }}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading && yuklendiMi}
            onRefresh={() => yukle()}
            tintColor={palet.primary}
            colors={[palet.primary]}
          />
        }
      >
        <EkranBasligi
          baslik="Streak"
          altBaslik="Her gün bir fotoğraf, birlikte büyüyen seri 🔥"
        />

        {!yuklendiMi && loading ? (
          <View className="items-center py-16">
            <ActivityIndicator color={palet.primary} />
            <Text className="mt-2" style={{ color: palet.metinIkincil }}>
              Streak yükleniyor...
            </Text>
          </View>
        ) : (
          <View className="gap-5">
            <StreakSayaci
              currentStreak={streak?.currentStreak ?? 0}
              longestStreak={streak?.longestStreak ?? 0}
            />

            {uyariMetni ? (
              <View
                className="rounded-2xl px-4 py-3"
                style={{
                  backgroundColor: benGonderdim
                    ? `${palet.secondary}18`
                    : "#FF6B3518",
                }}
              >
                <Text
                  className="text-center font-semibold"
                  style={{ color: palet.metin }}
                >
                  {uyariMetni}
                </Text>
              </View>
            ) : null}

            {streakSifirMi ? (
              <View
                className="rounded-2xl px-4 py-3"
                style={{ backgroundColor: palet.yuzeyIkincil }}
              >
                <Text className="text-center" style={{ color: palet.metinIkincil }}>
                  Seri sıfırlandı ama sorun değil — yeniden başlayalım! 💪
                </Text>
              </View>
            ) : null}

            {/* Bugünkü durum */}
            <View
              className="rounded-2xl p-4"
              style={{ backgroundColor: palet.yuzey, ...SHADOWS.yumusak }}
            >
              <Text className="mb-3 font-bold" style={{ color: palet.metin }}>
                Bugünkü Durum
              </Text>
              <View className="flex-row gap-3">
                <DurumKarti
                  etiket="Sen"
                  tamam={benGonderdim}
                  uri={benimFoto?.photoUrl}
                />
                <DurumKarti
                  etiket="Partner"
                  tamam={partnerGonderdi}
                  uri={partnerFoto?.photoUrl}
                />
              </View>
            </View>

            {/* Gönder butonu */}
            {!benGonderdim && partnerId ? (
              <Pressable
                onPress={fotoGonder}
                disabled={gonderiliyor}
                style={({ pressed }) => ({
                  opacity: pressed || gonderiliyor ? 0.85 : 1,
                  backgroundColor: palet.primary,
                  borderRadius: RADIUS.lg,
                  paddingVertical: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  ...SHADOWS.kart,
                })}
              >
                {gonderiliyor ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Camera size={22} color="#FFFFFF" strokeWidth={2.2} />
                    <Text className="ml-2 text-lg font-bold text-white">
                      Bugünkü Fotoğrafını Gönder
                    </Text>
                  </>
                )}
              </Pressable>
            ) : benGonderdim ? (
              <View
                className="items-center rounded-2xl py-4"
                style={{ backgroundColor: palet.yuzeyIkincil }}
              >
                <Text className="font-semibold" style={{ color: palet.metin }}>
                  Bugünkü fotoğrafını gönderdin ✅
                </Text>
              </View>
            ) : null}

            {/* Geçmiş */}
            <View>
              <Text
                className="mb-3 text-lg font-bold"
                style={{ color: palet.metin }}
              >
                Geçmiş
              </Text>
              <StreakGecmisi history={history} userId={userId} />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DurumKarti({
  etiket,
  tamam,
  uri,
}: {
  etiket: string;
  tamam: boolean;
  uri?: string;
}) {
  const palet = usePalet();

  return (
    <View className="flex-1">
      <Text
        className="mb-2 text-center text-sm font-semibold"
        style={{ color: palet.metinIkincil }}
      >
        {etiket} {tamam ? "✅" : "⏳"}
      </Text>
      {uri ? (
        <Image
          source={{ uri }}
          className="h-36 w-full rounded-xl"
          style={{ borderRadius: RADIUS.md }}
          resizeMode="cover"
        />
      ) : (
        <View
          className="h-36 items-center justify-center rounded-xl"
          style={{
            backgroundColor: palet.yuzeyIkincil,
            borderRadius: RADIUS.md,
          }}
        >
          <Text style={{ color: palet.metinIkincil }}>
            {tamam ? "Gönderildi" : "Bekleniyor"}
          </Text>
        </View>
      )}
    </View>
  );
}
