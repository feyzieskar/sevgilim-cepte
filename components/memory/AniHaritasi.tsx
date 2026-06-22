// ====================================================================
// AniHaritasi
// ====================================================================
// Konumu olan anıları harita üzerinde pin (marker) olarak gösterir.
// Bir pine dokununca altta o anının önizlemesi (fotoğraf + not) çıkar;
// önizlemeye dokununca detay ekranına gidilir.
//
// NOT: react-native-maps Expo Go'da sınırlı çalışabilir; tam destek
//      için development build önerilir.
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT, Region } from "react-native-maps";

import { RADIUS, SHADOWS } from "@/constants/theme";
import { tarihKisa } from "@/constants/tarih";
import type { Memory } from "@/store/memoryStore";
import { usePalet } from "@/store/useThemeStore";

interface AniHaritasiProps {
  memories: Memory[]; // yalnızca konumu olanlar gelmeli
  onPress: (memory: Memory) => void;
}

export function AniHaritasi({ memories, onPress }: AniHaritasiProps) {
  const palet = usePalet();
  const [secili, setSecili] = useState<Memory | null>(null);

  // Başlangıç bölgesi: ilk konumlu anı (yoksa Türkiye geneli)
  const baslangic: Region = useMemo(() => {
    const ilk = memories[0];
    if (ilk?.latitude != null && ilk?.longitude != null) {
      return {
        latitude: ilk.latitude,
        longitude: ilk.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      };
    }
    return {
      latitude: 39.0,
      longitude: 35.0,
      latitudeDelta: 8,
      longitudeDelta: 8,
    };
  }, [memories]);

  if (memories.length === 0) {
    return (
      <View
        className="items-center justify-center py-16"
        style={{ backgroundColor: palet.yuzey, borderRadius: RADIUS.lg, ...SHADOWS.yumusak }}
      >
        <Ionicons name="map-outline" size={40} color={palet.metinIkincil} />
        <Text className="mt-2 px-8 text-center" style={{ color: palet.metinIkincil }}>
          Henüz konumlu anı yok. Anı eklerken "Konumumu kullan" ile
          gittiğiniz yerleri haritaya ekleyebilirsiniz 🗺️
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        height: 420,
        borderRadius: RADIUS.lg,
        overflow: "hidden",
        ...SHADOWS.kart,
      }}
    >
      <MapView
        provider={PROVIDER_DEFAULT}
        style={{ flex: 1 }}
        initialRegion={baslangic}
      >
        {memories.map((m) => (
          <Marker
            key={m.id}
            coordinate={{ latitude: m.latitude!, longitude: m.longitude! }}
            pinColor="#FF6B9D"
            onPress={() => setSecili(m)}
          />
        ))}
      </MapView>

      {/* Seçili anının önizleme kartı */}
      {secili ? (
        <Pressable
          onPress={() => onPress(secili)}
          className="absolute left-3 right-3 flex-row items-center p-3"
          style={{
            bottom: 12,
            backgroundColor: palet.yuzey,
            borderRadius: RADIUS.md,
            ...SHADOWS.kart,
          }}
        >
          <Image
            source={{ uri: secili.photoUri }}
            style={{ width: 56, height: 56, borderRadius: RADIUS.sm }}
            resizeMode="cover"
          />
          <View className="ml-3 flex-1">
            {secili.locationName ? (
              <Text className="font-bold" style={{ color: palet.metin }} numberOfLines={1}>
                {secili.locationName}
              </Text>
            ) : null}
            <Text className="text-xs" style={{ color: palet.metinIkincil }}>
              {tarihKisa(secili.date)}
            </Text>
            {secili.note ? (
              <Text className="text-sm" style={{ color: palet.metin }} numberOfLines={1}>
                {secili.note}
              </Text>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={20} color={palet.metinIkincil} />
        </Pressable>
      ) : null}
    </View>
  );
}
