// ====================================================================
// SevgiSaatiBolumu — romantik istek butonları + onay animasyonu
// ====================================================================

import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Pressable, Text, View } from "react-native";

import { SonIsteklerListesi } from "@/components/emotion/SonIsteklerListesi";
import { RADIUS, SHADOWS } from "@/constants/theme";
import { SEVGI_EYLEMLERI, SevgiEylemi, useEmotionStore } from "@/store/emotionStore";
import { usePalet } from "@/store/useThemeStore";

export function SevgiSaatiBolumu() {
  const palet = usePalet();
  const events = useEmotionStore((s) => s.events);
  const sendLove = useEmotionStore((s) => s.sendLove);
  const gonderiliyor = useEmotionStore((s) => s.gonderiliyor);

  const [gonderildi, setGonderildi] = useState(false);
  const olcek = useRef(new Animated.Value(0)).current;
  const opaklik = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!gonderildi) return;
    olcek.setValue(0.5);
    opaklik.setValue(0);
    Animated.parallel([
      Animated.spring(olcek, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(opaklik, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    const zamanlayici = setTimeout(() => {
      Animated.timing(opaklik, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => setGonderildi(false));
    }, 2200);

    return () => clearTimeout(zamanlayici);
  }, [gonderildi, olcek, opaklik]);

  const eylemGonder = async (action: SevgiEylemi) => {
    const sonuc = await sendLove(action);
    if (!sonuc) {
      Alert.alert(
        "Gönderilemedi",
        "Mesajın iletilemedi. İnternet bağlantını kontrol edip tekrar dene."
      );
      return;
    }
    setGonderildi(true);
  };

  return (
    <View style={{ position: "relative", minHeight: 280 }}>
      <Text className="mb-4 text-center text-base" style={{ color: palet.metinIkincil }}>
        Bir dokunuşla sevgine haber ver 💕
      </Text>

      <View className="flex-row flex-wrap gap-3">
        {SEVGI_EYLEMLERI.map((s) => (
          <Pressable
            key={s.action}
            onPress={() => eylemGonder(s.action)}
            disabled={gonderiliyor}
            className="min-w-[46%] flex-1 items-center rounded-2xl px-3 py-5"
            style={{
              backgroundColor: palet.yuzey,
              borderWidth: 1.5,
              borderColor: palet.primary,
              ...SHADOWS.yumusak,
            }}
          >
            <Text className="text-center text-sm font-bold" style={{ color: palet.metin }}>
              {s.etiket}
            </Text>
          </Pressable>
        ))}
      </View>

      {gonderiliyor ? (
        <View className="mt-4 items-center">
          <ActivityIndicator color={palet.primary} />
        </View>
      ) : null}

      {/* Gönderildi onay animasyonu */}
      {gonderildi ? (
        <Animated.View
          pointerEvents="none"
          className="absolute inset-0 items-center justify-center"
          style={{ opacity: opaklik }}
        >
          <Animated.View
            className="items-center rounded-3xl px-10 py-8"
            style={{
              backgroundColor: palet.primary,
              transform: [{ scale: olcek }],
              borderRadius: RADIUS.lg,
              ...SHADOWS.kart,
            }}
          >
            <Text style={{ fontSize: 40 }}>💌</Text>
            <Text className="mt-2 text-lg font-bold text-white">Gönderildi 💕</Text>
          </Animated.View>
        </Animated.View>
      ) : null}

      <SonIsteklerListesi events={events} type="love" />
    </View>
  );
}
