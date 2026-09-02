// ====================================================================
// RUH HALİ EKRANI — Günlük mood tracker
// ====================================================================

import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MoodGecmisi } from "@/components/mood/MoodGecmisi";
import { MoodSecici } from "@/components/mood/MoodSecici";
import { EkranBasligi } from "@/components/ui/EkranBasligi";
import { RADIUS, SHADOWS } from "@/constants/theme";
import { dusukMoodMu, MoodTipi, moodBilgisi } from "@/data/moods";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { moodSaatFormat, useMoodStore } from "@/store/moodStore";
import { usePalet } from "@/store/useThemeStore";

export default function RuhHaliEkrani() {
  const palet = usePalet();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);

  const todayMoods = useMoodStore((s) => s.todayMoods);
  const history = useMoodStore((s) => s.history);
  const partnerId = useMoodStore((s) => s.partnerId);
  const loading = useMoodStore((s) => s.loading);
  const yuklendiMi = useMoodStore((s) => s.yuklendiMi);
  const kaydediliyor = useMoodStore((s) => s.kaydediliyor);
  const yukle = useMoodStore((s) => s.yukle);
  const setTodayMood = useMoodStore((s) => s.setTodayMood);
  const setMode = useChatStore((s) => s.setMode);

  const benim = useMemo(() => todayMoods.find((m) => m.createdBy === userId), [todayMoods, userId]);
  const partnerin = useMemo(
    () => (partnerId ? todayMoods.find((m) => m.createdBy === partnerId) : undefined),
    [todayMoods, partnerId]
  );

  const [seciliMood, setSeciliMood] = useState<MoodTipi | undefined>(benim?.mood);
  const [not, setNot] = useState(benim?.note ?? "");

  useEffect(() => {
    if (!yuklendiMi) void yukle();
  }, [yuklendiMi, yukle]);

  useEffect(() => {
    if (benim) {
      setSeciliMood(benim.mood);
      setNot(benim.note ?? "");
    }
  }, [benim]);

  const moodKaydet = async (mood: MoodTipi, emoji: string) => {
    setSeciliMood(mood);
    const sonuc = await setTodayMood(mood, emoji, not);
    if (!sonuc) {
      Alert.alert("Kaydedilemedi", "Ruh halin kaydedilirken bir sorun oluştu.");
    }
  };

  const notKaydet = async () => {
    if (!seciliMood) return;
    const bilgi = moodBilgisi(seciliMood);
    await setTodayMood(seciliMood, bilgi.emoji, not);
  };

  const feyziMoraleGit = () => {
    setMode("moral");
    router.push("/(tabs)/feyzi-ai");
  };

  const sevgiSaatineGit = () => {
    router.push("/duygular");
  };

  const partnerDusukMood = partnerin && dusukMoodMu(partnerin.mood);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: palet.arkaplan }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={loading && yuklendiMi}
            onRefresh={() => yukle()}
            tintColor={palet.primary}
            colors={[palet.primary]}
          />
        }
      >
        <EkranBasligi baslik="Ruh Hali" altBaslik="Bugün nasıl hissediyorsun? 🌈" geriDugmesi />

        {!yuklendiMi && loading ? (
          <View className="items-center py-16">
            <ActivityIndicator color={palet.primary} />
          </View>
        ) : (
          <View className="gap-5">
            {/* Kendi ruh halin */}
            <View
              className="rounded-2xl p-4"
              style={{ backgroundColor: palet.yuzey, ...SHADOWS.yumusak }}
            >
              <Text className="mb-4 text-lg font-bold" style={{ color: palet.metin }}>
                Bugün nasıl hissediyorsun?
              </Text>
              <MoodSecici secili={seciliMood} onChange={moodKaydet} disabled={kaydediliyor} />

              <Text
                className="mb-2 mt-5 text-sm font-semibold"
                style={{ color: palet.metinIkincil }}
              >
                Kısa not (opsiyonel)
              </Text>
              <TextInput
                value={not}
                onChangeText={setNot}
                onBlur={notKaydet}
                placeholder="Bugün aklında ne var?"
                placeholderTextColor={palet.metinIkincil}
                multiline
                style={{
                  backgroundColor: palet.yuzeyIkincil,
                  borderRadius: RADIUS.md,
                  color: palet.metin,
                  padding: 14,
                  minHeight: 72,
                  textAlignVertical: "top",
                }}
              />

              {kaydediliyor ? <ActivityIndicator className="mt-3" color={palet.primary} /> : null}
            </View>

            {/* Partner ruh hali */}
            <View
              className="rounded-2xl p-4"
              style={{ backgroundColor: palet.yuzey, ...SHADOWS.yumusak }}
            >
              <Text className="mb-3 text-lg font-bold" style={{ color: palet.metin }}>
                Partnerin bugün
              </Text>

              {partnerin ? (
                <View>
                  <View className="flex-row items-center">
                    <Text style={{ fontSize: 40 }}>{partnerin.emoji}</Text>
                    <View className="ml-4 flex-1">
                      <Text className="text-base font-semibold" style={{ color: palet.metin }}>
                        {moodBilgisi(partnerin.mood).etiket}
                      </Text>
                      <Text className="mt-0.5 text-sm" style={{ color: palet.metinIkincil }}>
                        {moodSaatFormat(partnerin.createdAt)}
                      </Text>
                    </View>
                  </View>
                  {partnerin.note ? (
                    <Text className="mt-3 italic" style={{ color: palet.metinIkincil }}>
                      {`"${partnerin.note}"`}
                    </Text>
                  ) : null}
                </View>
              ) : (
                <Text style={{ color: palet.metinIkincil }}>
                  Partner henüz bugünkü ruh halini paylaşmadı ⏳
                </Text>
              )}

              {partnerDusukMood ? (
                <View className="mt-4 gap-2">
                  <Text className="text-center font-semibold" style={{ color: palet.metin }}>
                    Ona moral ver 💙
                  </Text>
                  <Pressable
                    onPress={feyziMoraleGit}
                    className="rounded-xl py-3"
                    style={{ backgroundColor: `${palet.primary}18` }}
                  >
                    <Text className="text-center font-semibold" style={{ color: palet.primary }}>
                      Feyzi ile moral ver 💬
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={sevgiSaatineGit}
                    className="rounded-xl py-3"
                    style={{ backgroundColor: palet.yuzeyIkincil }}
                  >
                    <Text className="text-center font-semibold" style={{ color: palet.metin }}>
                      {"Sevgi Saati'ne git 💕"}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>

            {/* Geçmiş */}
            <View>
              <Text className="mb-3 text-lg font-bold" style={{ color: palet.metin }}>
                Son 14 Gün
              </Text>
              <MoodGecmisi history={history} limit={14} />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
