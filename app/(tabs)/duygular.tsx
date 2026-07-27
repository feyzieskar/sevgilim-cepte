// ====================================================================
// DUYGULAR SEKMESİ
// ====================================================================
// 3 alt bölüm (segmented control):
//   🍽️ Karnım Acıktı — açlık seviyesi + yemek önerisi + push
//   💕 Sevgi Saati — romantik istek butonları + push
//   🎁 Sürprizler — mevcut sürpriz kutusu (değiştirilmeden)
// ====================================================================

import { useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  DuyguAltBolum,
  DuyguSekmeleri,
} from "@/components/emotion/DuyguSekmeleri";
import { KarnimAciktiBolumu } from "@/components/emotion/KarnimAciktiBolumu";
import { SevgiSaatiBolumu } from "@/components/emotion/SevgiSaatiBolumu";
import { SurprizlerBolumu } from "@/components/emotion/SurprizlerBolumu";
import { EkranBasligi } from "@/components/ui/EkranBasligi";
import { useEmotionStore } from "@/store/emotionStore";
import { usePalet } from "@/store/useThemeStore";

export default function DuygularEkrani() {
  const palet = usePalet();
  const [altBolum, setAltBolum] = useState<DuyguAltBolum>("karnim");
  const fetchEvents = useEmotionStore((s) => s.fetchEvents);
  const loading = useEmotionStore((s) => s.loading);
  const yuklendiMi = useEmotionStore((s) => s.yuklendiMi);

  const altBaslik =
    altBolum === "karnim"
      ? "Acıktığında sevgiline haber ver 🍽️"
      : altBolum === "sevgi"
        ? "Kalbinden geçeni bir dokunuşla ilet 💕"
        : "Sana özel sakladıklarım 🎁";

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: palet.arkaplan }}>
      <View className="px-5 pt-2">
        <EkranBasligi baslik="Duygular" altBaslik={altBaslik} />
      </View>

      <View className="mt-3">
        <DuyguSekmeleri secili={altBolum} onChange={setAltBolum} />
      </View>

      {altBolum === "surpriz" ? (
        <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 20 }}>
          <SurprizlerBolumu />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading && yuklendiMi}
              onRefresh={fetchEvents}
              tintColor={palet.primary}
              colors={[palet.primary]}
            />
          }
        >
          {altBolum === "karnim" ? <KarnimAciktiBolumu /> : null}
          {altBolum === "sevgi" ? <SevgiSaatiBolumu /> : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
