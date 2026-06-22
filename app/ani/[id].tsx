// ====================================================================
// ANI DETAY EKRANI  (app/ani/[id].tsx)
// ====================================================================
// Tab bar'ın üzerine açılan tam ekran detay:
// büyük fotoğraf, tarih, not, konum (mini harita), favori/düzenle/sil.
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";

import { AniFormModal, AniFormVerisi } from "@/components/memory/AniFormModal";
import { RADIUS, SHADOWS } from "@/constants/theme";
import { gunMetni, tarihUzun } from "@/constants/tarih";
import { useMemoryStore } from "@/store/memoryStore";
import { usePalet } from "@/store/useThemeStore";

export default function AniDetayEkrani() {
  const palet = usePalet();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Store'a abone ol: favori/düzenleme sonrası ekran kendini günceller
  const memory = useMemoryStore((s) => s.memories.find((m) => m.id === id));
  const toggleFavorite = useMemoryStore((s) => s.toggleFavorite);
  const updateMemory = useMemoryStore((s) => s.updateMemory);
  const deleteMemory = useMemoryStore((s) => s.deleteMemory);

  const [duzenleAcik, setDuzenleAcik] = useState(false);

  // Anı bulunamadıysa (silinmiş olabilir)
  if (!memory) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palet.arkaplan }}>
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="image-outline" size={44} color={palet.metinIkincil} />
          <Text className="mt-3 text-center" style={{ color: palet.metinIkincil }}>
            Bu anı bulunamadı.
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-5 rounded-2xl px-6 py-3"
            style={{ backgroundColor: palet.primary }}
          >
            <Text className="font-bold text-white">Geri dön</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const silOnayi = () => {
    Alert.alert("Anıyı sil", "Bu anı kalıcı olarak silinsin mi?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: () => {
          // Önce ekrandan çık, silme buluta arka planda yazılsın
          router.back();
          deleteMemory(memory.id);
        },
      },
    ]);
  };

  const guncelle = async (veri: AniFormVerisi) => {
    await updateMemory(memory.id, veri);
    setDuzenleAcik(false);
  };

  const konumVar = memory.latitude != null && memory.longitude != null;

  return (
    <View style={{ flex: 1, backgroundColor: palet.arkaplan }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Büyük fotoğraf + üst butonlar */}
        <View>
          <Image
            source={{ uri: memory.photoUri }}
            style={{ width: "100%", height: 420 }}
            resizeMode="cover"
          />
          <SafeAreaView edges={["top"]} className="absolute left-0 right-0 top-0">
            <View className="flex-row items-center justify-between px-4 pt-2">
              {/* Geri */}
              <Pressable
                onPress={() => router.back()}
                className="h-11 w-11 items-center justify-center rounded-full"
                style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
              >
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </Pressable>
              {/* Favori */}
              <Pressable
                onPress={() => toggleFavorite(memory.id)}
                className="h-11 w-11 items-center justify-center rounded-full"
                style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
              >
                <Ionicons
                  name={memory.isFavorite ? "heart" : "heart-outline"}
                  size={24}
                  color={memory.isFavorite ? "#FF6B9D" : "#FFFFFF"}
                />
              </Pressable>
            </View>
          </SafeAreaView>
        </View>

        <View className="px-5 pt-5">
          {/* Tarih */}
          <View className="flex-row items-center">
            <Ionicons name="calendar" size={16} color={palet.primary} />
            <Text className="ml-2 font-semibold" style={{ color: palet.metin }}>
              {tarihUzun(memory.date)}
            </Text>
            <Text className="ml-2 text-sm" style={{ color: palet.metinIkincil }}>
              · {gunMetni(memory.date)}
            </Text>
          </View>

          {/* Not */}
          {memory.note ? (
            <Text className="mt-4 text-lg leading-7" style={{ color: palet.metin }}>
              {memory.note}
            </Text>
          ) : null}

          {/* Konum */}
          {memory.locationName ? (
            <View className="mt-4 flex-row items-center">
              <Ionicons name="location" size={16} color={palet.secondary} />
              <Text className="ml-1 font-semibold" style={{ color: palet.secondary }}>
                {memory.locationName}
              </Text>
            </View>
          ) : null}

          {/* Mini harita */}
          {konumVar ? (
            <View
              className="mt-3"
              style={{ height: 180, borderRadius: RADIUS.md, overflow: "hidden", ...SHADOWS.yumusak }}
            >
              <MapView
                provider={PROVIDER_DEFAULT}
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: memory.latitude!,
                  longitude: memory.longitude!,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker
                  coordinate={{ latitude: memory.latitude!, longitude: memory.longitude! }}
                  pinColor="#FF6B9D"
                />
              </MapView>
            </View>
          ) : null}

          {/* Aksiyonlar: Düzenle / Sil */}
          <View className="mt-6 flex-row gap-3">
            <Pressable
              onPress={() => setDuzenleAcik(true)}
              className="flex-1 flex-row items-center justify-center rounded-2xl py-4"
              style={{ backgroundColor: palet.primary }}
            >
              <Ionicons name="create-outline" size={20} color="#FFFFFF" />
              <Text className="ml-2 font-bold text-white">Düzenle</Text>
            </Pressable>
            <Pressable
              onPress={silOnayi}
              className="flex-row items-center justify-center rounded-2xl px-5 py-4"
              style={{ backgroundColor: palet.yuzeyIkincil }}
            >
              <Ionicons name="trash-outline" size={20} color="#E14D80" />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Düzenleme modalı */}
      <AniFormModal
        visible={duzenleAcik}
        onClose={() => setDuzenleAcik(false)}
        duzenlenen={memory}
        onKaydet={guncelle}
      />
    </View>
  );
}
