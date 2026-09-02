// ====================================================================
// ANILAR EKRANI  (stack route — Menü üzerinden açılır)
// ====================================================================
// - "Bu gün ne olmuştu?" bölümü (üstte)
// - Filtre: Tümü / Favoriler / Harita
// - Zaman tüneli (en yeni üstte) fotoğraf kartları
// - Harita görünümü (konumlu anılar pin olarak)
// - (+) ile yeni anı ekleme, boş durum mesajı
// Veriler Supabase memoryStore üzerinden gelir.
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AniFormModal, AniFormVerisi } from "@/components/memory/AniFormModal";
import { AniHaritasi } from "@/components/memory/AniHaritasi";
import { AniKarti } from "@/components/memory/AniKarti";
import { BuGunNeOlmustu } from "@/components/memory/BuGunNeOlmustu";
import { EkranBasligi } from "@/components/ui/EkranBasligi";
import { RADIUS, SHADOWS } from "@/constants/theme";
import { Memory, useMemoryStore } from "@/store/memoryStore";
import { usePalet } from "@/store/useThemeStore";

type Filtre = "tumu" | "favori" | "harita";

export default function AnilarEkrani() {
  const palet = usePalet();
  const router = useRouter();

  const memories = useMemoryStore((s) => s.memories);
  const addMemory = useMemoryStore((s) => s.addMemory);
  const toggleFavorite = useMemoryStore((s) => s.toggleFavorite);
  const fetchMemories = useMemoryStore((s) => s.fetchMemories);
  const loading = useMemoryStore((s) => s.loading);
  const yuklendiMi = useMemoryStore((s) => s.yuklendiMi);

  const [filtre, setFiltre] = useState<Filtre>("tumu");
  const [modalAcik, setModalAcik] = useState(false);

  // Zaman tüneli: en yeni anı üstte
  const sirali = useMemo(
    () => [...memories].sort((a, b) => b.date.localeCompare(a.date)),
    [memories]
  );

  const gosterilen = useMemo(() => {
    if (filtre === "favori") return sirali.filter((m) => m.isFavorite);
    return sirali;
  }, [sirali, filtre]);

  // Konumu olan anılar (harita için)
  const konumlular = useMemo(
    () => memories.filter((m) => m.latitude != null && m.longitude != null),
    [memories]
  );

  const detayaGit = (m: Memory) => router.push({ pathname: "/ani/[id]", params: { id: m.id } });

  const kaydet = async (veri: AniFormVerisi) => {
    const yeni = await addMemory(veri);
    if (!yeni) {
      Alert.alert(
        "Kaydedilemedi",
        "Anı buluta kaydedilemedi. Fotoğraf yüklenirken bir sorun oluştu, tekrar dene."
      );
      return;
    }
    setModalAcik(false);
  };

  // Hiç anı yoksa gösterilecek boş durum
  const bosDurum = memories.length === 0;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: palet.arkaplan }}>
      <View className="px-5 pt-2">
        <EkranBasligi baslik="Anılar" altBaslik="Birlikte yarattığımız anlar 📸" geriDugmesi />

        {/* Filtre seçici */}
        <View
          className="mt-2 flex-row rounded-full p-1"
          style={{ backgroundColor: palet.yuzeyIkincil }}
        >
          {(
            [
              { id: "tumu", etiket: "Tümü", ikon: "albums" },
              { id: "favori", etiket: "Favoriler", ikon: "heart" },
              { id: "harita", etiket: "Harita", ikon: "map" },
            ] as const
          ).map((s) => {
            const aktif = filtre === s.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => setFiltre(s.id)}
                className="flex-1 flex-row items-center justify-center rounded-full py-2"
                style={{ backgroundColor: aktif ? palet.primary : "transparent" }}
              >
                <Ionicons name={s.ikon} size={15} color={aktif ? "#FFFFFF" : palet.metinIkincil} />
                <Text
                  className="ml-1.5 text-sm font-semibold"
                  style={{ color: aktif ? "#FFFFFF" : palet.metinIkincil }}
                >
                  {s.etiket}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading && yuklendiMi}
            onRefresh={fetchMemories}
            tintColor={palet.primary}
            colors={[palet.primary]}
          />
        }
      >
        {!yuklendiMi && loading ? (
          <View className="items-center py-10">
            <ActivityIndicator color={palet.primary} />
            <Text className="mt-2" style={{ color: palet.metinIkincil }}>
              Anılar yükleniyor 💕
            </Text>
          </View>
        ) : bosDurum ? (
          // ---- Boş durum ----
          <View
            className="mt-10 items-center px-8 py-12"
            style={{ backgroundColor: palet.yuzey, borderRadius: RADIUS.lg, ...SHADOWS.yumusak }}
          >
            <Text style={{ fontSize: 52 }}>📷💕</Text>
            <Text className="mt-4 text-center text-lg font-bold" style={{ color: palet.metin }}>
              Henüz bir anımız yok
            </Text>
            <Text className="mt-2 text-center" style={{ color: palet.metinIkincil }}>
              İlk güzel anınızı eklemek için aşağıdaki + butonuna dokun.
            </Text>
          </View>
        ) : filtre === "harita" ? (
          // ---- Harita görünümü ----
          <AniHaritasi memories={konumlular} onPress={detayaGit} />
        ) : (
          // ---- Liste (zaman tüneli) görünümü ----
          <>
            <BuGunNeOlmustu memories={memories} onPress={detayaGit} />

            {gosterilen.length > 0 ? (
              <View className="mt-2 gap-5">
                {gosterilen.map((m) => (
                  <AniKarti
                    key={m.id}
                    memory={m}
                    onPress={detayaGit}
                    onToggleFavorite={(x) => toggleFavorite(x.id)}
                  />
                ))}
              </View>
            ) : (
              <View
                className="mt-2 items-center py-12"
                style={{
                  backgroundColor: palet.yuzey,
                  borderRadius: RADIUS.lg,
                  ...SHADOWS.yumusak,
                }}
              >
                <Ionicons name="heart-outline" size={36} color={palet.metinIkincil} />
                <Text className="mt-2" style={{ color: palet.metinIkincil }}>
                  Henüz favori anın yok. Kalbe dokunarak favorile 💕
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Yeni anı ekleme butonu (FAB) */}
      <Pressable
        onPress={() => setModalAcik(true)}
        className="absolute h-16 w-16 items-center justify-center rounded-full"
        style={{ right: 24, bottom: 28, backgroundColor: palet.primary, ...SHADOWS.kart }}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </Pressable>

      {/* Form modalı */}
      <AniFormModal visible={modalAcik} onClose={() => setModalAcik(false)} onKaydet={kaydet} />
    </SafeAreaView>
  );
}
