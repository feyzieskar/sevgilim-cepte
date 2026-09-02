// ====================================================================
// KarnimAciktiBolumu — açlık seviyesi + yemek önerisi + push
// ====================================================================

import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";

import { SonIsteklerListesi } from "@/components/emotion/SonIsteklerListesi";
import { GRADIENTS, RADIUS, SHADOWS } from "@/constants/theme";
import { ACIKLIK_SECENEKLERI, AciklikSeviyesi, aciklikEtiketi } from "@/data/yemekOnerileri";
import { useEmotionStore } from "@/store/emotionStore";
import { usePalet } from "@/store/useThemeStore";

export function KarnimAciktiBolumu() {
  const palet = usePalet();
  const events = useEmotionStore((s) => s.events);
  const sendHungry = useEmotionStore((s) => s.sendHungry);
  const gonderiliyor = useEmotionStore((s) => s.gonderiliyor);

  const [seviyeSecimAcik, setSeviyeSecimAcik] = useState(false);
  const [sonOneri, setSonOneri] = useState<{
    seviye: AciklikSeviyesi;
    yemek: string;
  } | null>(null);

  const seviyeSec = async (seviye: AciklikSeviyesi) => {
    setSeviyeSecimAcik(false);
    const sonuc = await sendHungry(seviye);
    if (!sonuc) {
      Alert.alert(
        "Gönderilemedi",
        "İsteğin kaydedilemedi. İnternet bağlantını kontrol edip tekrar dene."
      );
      return;
    }
    setSonOneri({
      seviye,
      yemek: sonuc.suggestion ?? "",
    });
  };

  return (
    <View>
      {/* Ana buton */}
      <Pressable
        onPress={() => setSeviyeSecimAcik(true)}
        disabled={gonderiliyor}
        style={{ borderRadius: RADIUS.lg, overflow: "hidden", ...SHADOWS.kart }}
      >
        <LinearGradient
          colors={[...GRADIENTS.sicak]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="items-center px-6 py-10"
        >
          {gonderiliyor ? (
            <ActivityIndicator color="#FFFFFF" size="large" />
          ) : (
            <>
              <Text style={{ fontSize: 48 }}>🍽️</Text>
              <Text className="mt-3 text-2xl font-bold text-white">Karnım Acıktı</Text>
              <Text className="mt-2 text-center text-sm text-white/90">
                Sevgiline haber ver, yemek önerisi al 💕
              </Text>
            </>
          )}
        </LinearGradient>
      </Pressable>

      {/* Açlık seviyesi seçimi */}
      {seviyeSecimAcik ? (
        <View
          className="mt-5 gap-3 rounded-2xl p-4"
          style={{ backgroundColor: palet.yuzey, ...SHADOWS.yumusak }}
        >
          <Text className="text-center text-base font-bold" style={{ color: palet.metin }}>
            Ne kadar açsın? 🍴
          </Text>
          {ACIKLIK_SECENEKLERI.map((s) => (
            <Pressable
              key={s.seviye}
              onPress={() => seviyeSec(s.seviye)}
              className="items-center rounded-xl py-4"
              style={{
                backgroundColor: palet.yuzeyIkincil,
                borderWidth: 1,
                borderColor: palet.kenarlik,
              }}
            >
              <Text className="text-base font-semibold" style={{ color: palet.metin }}>
                {s.etiket}
              </Text>
            </Pressable>
          ))}
          <Pressable onPress={() => setSeviyeSecimAcik(false)} className="py-2">
            <Text className="text-center text-sm" style={{ color: palet.metinIkincil }}>
              Vazgeç
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* Son öneri kartı */}
      {sonOneri ? (
        <View
          className="mt-5 items-center rounded-2xl px-5 py-6"
          style={{ backgroundColor: palet.yuzey, ...SHADOWS.yumusak }}
        >
          <Text className="text-sm font-semibold" style={{ color: palet.metinIkincil }}>
            {aciklikEtiketi(sonOneri.seviye)} — sana önerim:
          </Text>
          <Text className="mt-2 text-center text-xl font-bold" style={{ color: palet.primary }}>
            {sonOneri.yemek}
          </Text>
          <Text className="mt-3 text-center text-xs" style={{ color: palet.metinIkincil }}>
            Sevgiline de gönderildi 💌
          </Text>
        </View>
      ) : null}

      <SonIsteklerListesi events={events} type="hungry" />
    </View>
  );
}
