// ====================================================================
// AniKarti  (Zaman tüneli kartı)
// ====================================================================
// Tek bir anıyı gösteren fotoğraf odaklı kart: büyük fotoğraf,
// tarih, kısa not ve favori (kalp) butonu. Tıklanınca detay ekranına.
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";

import { RADIUS, SHADOWS } from "@/constants/theme";
import { tarihUzun } from "@/constants/tarih";
import type { Memory } from "@/store/memoryStore";
import { usePalet } from "@/store/useThemeStore";

interface AniKartiProps {
  memory: Memory;
  onPress: (memory: Memory) => void;
  onToggleFavorite: (memory: Memory) => void;
}

export function AniKarti({ memory, onPress, onToggleFavorite }: AniKartiProps) {
  const palet = usePalet();

  return (
    <Pressable
      onPress={() => onPress(memory)}
      style={{
        backgroundColor: palet.yuzey,
        borderRadius: RADIUS.lg,
        overflow: "hidden",
        ...SHADOWS.kart,
      }}
    >
      {/* Fotoğraf + favori butonu */}
      <View>
        <Image
          source={{ uri: memory.photoUri }}
          style={{ width: "100%", height: 220 }}
          resizeMode="cover"
        />
        <Pressable
          onPress={() => onToggleFavorite(memory)}
          hitSlop={10}
          className="absolute right-3 top-3 h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
        >
          <Ionicons
            name={memory.isFavorite ? "heart" : "heart-outline"}
            size={22}
            color={memory.isFavorite ? "#FF6B9D" : "#FFFFFF"}
          />
        </Pressable>
      </View>

      {/* Bilgi alanı */}
      <View className="p-4">
        <View className="flex-row items-center">
          <Ionicons name="calendar-outline" size={14} color={palet.metinIkincil} />
          <Text className="ml-1 text-xs" style={{ color: palet.metinIkincil }}>
            {tarihUzun(memory.date)}
          </Text>
        </View>

        {memory.note ? (
          <Text
            className="mt-1 text-base"
            style={{ color: palet.metin }}
            numberOfLines={2}
          >
            {memory.note}
          </Text>
        ) : null}

        {memory.locationName ? (
          <View className="mt-2 flex-row items-center">
            <Ionicons name="location" size={14} color={palet.secondary} />
            <Text className="ml-1 text-xs" style={{ color: palet.secondary }}>
              {memory.locationName}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
