// ====================================================================
// SurprizKarti
// ====================================================================
// Bir sürprizi 3 farklı durumda gösterir:
//   1) Kilitli      -> koyu/gizemli kart, kilit ikonu + ipucu metni
//   2) Açılabilir    -> canlı gradyan kart + "Aç" butonu (parıltı hissi)
//   3) Açılmış       -> içerik (başlık, mesaj, foto) + "açıldı" rozeti
//
// "Aç" butonuna basınca reanimated ile scale + fade açılma animasyonu
// oynatılır, animasyon bitince store'da sürpriz açılır.
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Alert, Image, Pressable, Text, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { UNLOCK_TURLERI, kilitIpucu } from "@/constants/surpriz";
import { RADIUS, SHADOWS } from "@/constants/theme";
import { tarihUzun } from "@/constants/tarih";
import type { Surprise } from "@/store/surpriseStore";
import { usePalet } from "@/store/useThemeStore";

interface SurprizKartiProps {
  surprise: Surprise;
  // Koşulu sağlanmış ve açılabilir mi? (ekran hesaplar)
  acilabilir: boolean;
  onOpen: (s: Surprise) => void;
  onDelete: (s: Surprise) => void;
}

export function SurprizKarti({ surprise, acilabilir, onOpen, onDelete }: SurprizKartiProps) {
  const palet = usePalet();
  const tur = UNLOCK_TURLERI[surprise.unlockType];

  // Açılma animasyonu için ortak değerler
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const [animasyonda, setAnimasyonda] = useState(false);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // "Aç" akışı: küçük bir "pat" animasyonu sonra içerik açılır
  const ac = () => {
    setAnimasyonda(true);
    // Kart hafifçe büyüyüp küçülür + bir an soluklaşır
    opacity.value = withSequence(
      withTiming(0.4, { duration: 160 }),
      withTiming(1, { duration: 260 })
    );
    scale.value = withSequence(
      withTiming(1.08, { duration: 160 }),
      withTiming(0.96, { duration: 120 }),
      withTiming(1, { duration: 220 }, (bitti) => {
        if (bitti) {
          runOnJS(setAnimasyonda)(false);
          runOnJS(onOpen)(surprise);
        }
      })
    );
  };

  const silOnayi = () => {
    Alert.alert("Sürprizi sil", `"${surprise.title}" silinsin mi?`, [
      { text: "Vazgeç", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: () => onDelete(surprise) },
    ]);
  };

  // -----------------------------------------------------------------
  // 3) AÇILMIŞ DURUM — içerik görünür
  // -----------------------------------------------------------------
  if (surprise.isOpened) {
    return (
      <View
        style={{
          backgroundColor: palet.yuzey,
          borderRadius: RADIUS.lg,
          overflow: "hidden",
          ...SHADOWS.kart,
        }}
      >
        {surprise.photoUri ? (
          <Image
            source={{ uri: surprise.photoUri }}
            style={{ width: "100%", height: 180 }}
            resizeMode="cover"
          />
        ) : null}

        <View className="p-5">
          {/* "açıldı" rozeti */}
          <View className="mb-2 flex-row items-center justify-between">
            <View
              className="flex-row items-center rounded-full px-3 py-1"
              style={{ backgroundColor: tur.renk + "22" }}
            >
              <Ionicons name="lock-open" size={13} color={tur.renk} />
              <Text className="ml-1 text-xs font-semibold" style={{ color: tur.renk }}>
                Açıldı
              </Text>
            </View>
            <Pressable onPress={silOnayi} hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color={palet.metinIkincil} />
            </Pressable>
          </View>

          <Text className="text-xl font-bold" style={{ color: palet.metin }}>
            {surprise.title}
          </Text>
          <Text className="mt-2 text-base leading-7" style={{ color: palet.metin }}>
            {surprise.content}
          </Text>

          {surprise.openedAt ? (
            <Text className="mt-3 text-xs" style={{ color: palet.metinIkincil }}>
              {tarihUzun(surprise.openedAt.slice(0, 10))} tarihinde açıldı 💕
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  // -----------------------------------------------------------------
  // 2) AÇILABİLİR DURUM — canlı gradyan kart + "Aç" butonu
  // -----------------------------------------------------------------
  if (acilabilir) {
    return (
      <Animated.View style={animStyle}>
        <LinearGradient
          colors={["#FF8FB1", "#A06CD5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: RADIUS.lg, ...SHADOWS.kart }}
        >
          <View className="p-6">
            <View className="flex-row items-center justify-between">
              <View
                className="h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
              >
                <Ionicons name="gift" size={26} color="#FFFFFF" />
              </View>
              <Pressable onPress={silOnayi} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color="rgba(255,255,255,0.8)" />
              </Pressable>
            </View>

            <Text className="mt-4 text-xl font-bold text-white">{surprise.title}</Text>
            <Text className="mt-1 text-white" style={{ opacity: 0.9 }}>
              Senin için bir sürprizim var, açmaya hazır mısın? ✨
            </Text>

            <Pressable
              onPress={ac}
              disabled={animasyonda}
              className="mt-5 flex-row items-center justify-center rounded-2xl py-3"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <Ionicons name="sparkles" size={18} color="#A06CD5" />
              <Text className="ml-2 text-base font-bold" style={{ color: "#A06CD5" }}>
                Aç
              </Text>
            </Pressable>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  }

  // -----------------------------------------------------------------
  // 1) KİLİTLİ DURUM — gizemli koyu kart + kilit + ipucu
  // -----------------------------------------------------------------
  return (
    <View
      style={{
        backgroundColor: "#2B2335",
        borderRadius: RADIUS.lg,
        overflow: "hidden",
        ...SHADOWS.yumusak,
      }}
    >
      <View className="items-center p-7">
        <View
          className="h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          <Ionicons name="lock-closed" size={28} color="#C9A7EC" />
        </View>

        {/* Başlık kilitliyken gizli; sadece ipucu görünür */}
        <Text className="mt-4 text-center text-base font-semibold" style={{ color: "#E7DDF2" }}>
          Gizemli bir sürpriz
        </Text>
        <View
          className="mt-2 flex-row items-center rounded-full px-3 py-1.5"
          style={{ backgroundColor: tur.renk + "33" }}
        >
          <Ionicons name={tur.ikon} size={13} color="#E7DDF2" />
          <Text className="ml-1.5 text-xs font-semibold" style={{ color: "#E7DDF2" }}>
            {kilitIpucu(surprise.unlockType, surprise.unlockDate)}
          </Text>
        </View>

        {/* date tipinde tarih ipucu */}
        {surprise.unlockType === "date" && surprise.unlockDate ? (
          <Text className="mt-2 text-xs" style={{ color: "#9C8FB0" }}>
            {tarihUzun(surprise.unlockDate)}
          </Text>
        ) : null}

        {/* Admin silme (kilitliyken de silinebilsin) */}
        <Pressable onPress={silOnayi} hitSlop={8} className="absolute right-3 top-3">
          <Ionicons name="trash-outline" size={16} color="#6E627F" />
        </Pressable>
      </View>
    </View>
  );
}
