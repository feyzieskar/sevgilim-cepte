// ====================================================================
// BUCKET LİST EKRANI
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
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

import { BucketFormModal } from "@/components/bucket/BucketFormModal";
import { BucketKarti } from "@/components/bucket/BucketKarti";
import { BucketKutlama } from "@/components/bucket/BucketKutlama";
import { EkranBasligi } from "@/components/ui/EkranBasligi";
import {
  BUCKET_KATEGORILERI,
  BucketKategori,
} from "@/data/bucketList";
import { bugunISO } from "@/constants/tarih";
import { RADIUS, SHADOWS } from "@/constants/theme";
import { galeridenSec, kameradanCek } from "@/services/media";
import { useAuthStore } from "@/store/authStore";
import { useBucketListStore } from "@/store/bucketListStore";
import { useMemoryStore } from "@/store/memoryStore";
import { usePalet } from "@/store/useThemeStore";

type Gorunum = "yapilacak" | "tamamlanan";
type KategoriFiltre = "tumu" | BucketKategori;

export default function BucketListEkrani() {
  const palet = usePalet();
  const userId = useAuthStore((s) => s.user?.id);

  const items = useBucketListStore((s) => s.items);
  const loading = useBucketListStore((s) => s.loading);
  const yuklendiMi = useBucketListStore((s) => s.yuklendiMi);
  const fetchItems = useBucketListStore((s) => s.fetchItems);
  const addItem = useBucketListStore((s) => s.addItem);
  const deleteItem = useBucketListStore((s) => s.deleteItem);
  const toggleComplete = useBucketListStore((s) => s.toggleComplete);
  const addMemory = useMemoryStore((s) => s.addMemory);

  const [gorunum, setGorunum] = useState<Gorunum>("yapilacak");
  const [kategori, setKategori] = useState<KategoriFiltre>("tumu");
  const [modalAcik, setModalAcik] = useState(false);
  const [kutlama, setKutlama] = useState<{ visible: boolean; baslik: string }>({
    visible: false,
    baslik: "",
  });

  useEffect(() => {
    if (!yuklendiMi) void fetchItems();
  }, [yuklendiMi, fetchItems]);

  const filtrelenmis = useMemo(() => {
    return items.filter((item) => {
      const gorunumUygun =
        gorunum === "yapilacak" ? !item.isCompleted : item.isCompleted;
      const kategoriUygun =
        kategori === "tumu" || item.category === kategori;
      return gorunumUygun && kategoriUygun;
    });
  }, [items, gorunum, kategori]);

  const toplam = items.length;
  const tamamlanan = items.filter((i) => i.isCompleted).length;
  const yuzde = toplam > 0 ? Math.round((tamamlanan / toplam) * 100) : 0;

  const aniyaEkleTeklifi = useCallback(
    (baslik: string, photoUrl?: string, photoBase64?: string) => {
      if (!photoUrl && !photoBase64) return;
      Alert.alert(
        "Anılara da ekleyelim mi?",
        `"${baslik}" bu güzel anıyı anılara da kaydedelim mi? 📸`,
        [
          { text: "Hayır", style: "cancel" },
          {
            text: "Evet, ekle",
            onPress: () => {
              void addMemory({
                photoUri: photoUrl ?? "",
                photoBase64,
                date: bugunISO(),
                note: `Bucket list: ${baslik}`,
                isFavorite: false,
              });
            },
          },
        ]
      );
    },
    [addMemory]
  );

  const tamamlamaFotografi = (itemId: string, baslik: string) => {
    Alert.alert("Tebrikler! 🎉", "Tamamlama fotoğrafı eklemek ister misin?", [
      {
        text: "Kamera",
        onPress: async () => {
          const secim = await kameradanCek();
          if (!secim?.base64) return;
          const guncel = await toggleComplete(itemId, secim.base64);
          if (guncel?.isCompleted) {
            setKutlama({ visible: true, baslik });
            aniyaEkleTeklifi(baslik, guncel.completedPhotoUrl, secim.base64);
          }
        },
      },
      {
        text: "Galeri",
        onPress: async () => {
          const secim = await galeridenSec();
          if (!secim?.base64) return;
          const guncel = await toggleComplete(itemId, secim.base64);
          if (guncel?.isCompleted) {
            setKutlama({ visible: true, baslik });
            aniyaEkleTeklifi(baslik, guncel.completedPhotoUrl, secim.base64);
          }
        },
      },
      {
        text: "Fotosuz tamamla",
        onPress: async () => {
          const guncel = await toggleComplete(itemId);
          if (guncel?.isCompleted) {
            setKutlama({ visible: true, baslik });
          }
        },
      },
      { text: "Vazgeç", style: "cancel" },
    ]);
  };

  const maddeToggle = (id: string, baslik: string, suAnTamam: boolean) => {
    if (suAnTamam) {
      void toggleComplete(id);
      return;
    }
    tamamlamaFotografi(id, baslik);
  };

  const maddeSil = (id: string, baslik: string) => {
    Alert.alert("Sil", `"${baslik}" listeden silinsin mi?`, [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: () => deleteItem(id),
      },
    ]);
  };

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
            onRefresh={fetchItems}
            tintColor={palet.primary}
            colors={[palet.primary]}
          />
        }
      >
        <EkranBasligi
          baslik="Bucket List"
          altBaslik="Birlikte gerçekleştireceğimiz hayaller ✨"
          geriDugmesi
        />

        <View
          className="mt-2 rounded-2xl p-4"
          style={{ backgroundColor: palet.yuzey, ...SHADOWS.yumusak }}
        >
          <Text className="font-bold" style={{ color: palet.metin }}>
            {toplam} hayalden {tamamlanan}&apos;i gerçekleşti (%{yuzde})
          </Text>
          <View
            className="mt-3 h-3 overflow-hidden rounded-full"
            style={{ backgroundColor: palet.yuzeyIkincil }}
          >
            <View
              style={{
                width: `${yuzde}%`,
                height: "100%",
                backgroundColor: palet.primary,
                borderRadius: 999,
              }}
            />
          </View>
        </View>

        <View
          className="mt-4 flex-row rounded-full p-1"
          style={{ backgroundColor: palet.yuzeyIkincil }}
        >
          {(
            [
              { id: "yapilacak", etiket: "Yapılacaklar" },
              { id: "tamamlanan", etiket: "Tamamlananlar" },
            ] as const
          ).map((s) => {
            const aktif = gorunum === s.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => setGorunum(s.id)}
                className="flex-1 items-center rounded-full py-2.5"
                style={{
                  backgroundColor: aktif ? palet.primary : "transparent",
                }}
              >
                <Text
                  className="font-semibold"
                  style={{ color: aktif ? "#FFFFFF" : palet.metinIkincil }}
                >
                  {s.etiket}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          contentContainerStyle={{ gap: 8 }}
        >
          <FiltreChip
            etiket="Tümü"
            aktif={kategori === "tumu"}
            onPress={() => setKategori("tumu")}
          />
          {BUCKET_KATEGORILERI.map((k) => (
            <FiltreChip
              key={k.id}
              etiket={`${k.emoji} ${k.etiket}`}
              aktif={kategori === k.id}
              onPress={() => setKategori(k.id)}
            />
          ))}
        </ScrollView>

        {!yuklendiMi && loading ? (
          <ActivityIndicator className="mt-10" color={palet.primary} />
        ) : filtrelenmis.length > 0 ? (
          <View className="mt-4 gap-3">
            {filtrelenmis.map((item) => (
              <BucketKarti
                key={item.id}
                item={item}
                benimId={userId}
                onToggle={() =>
                  maddeToggle(item.id, item.title, item.isCompleted)
                }
                onDelete={() => maddeSil(item.id, item.title)}
              />
            ))}
          </View>
        ) : (
          <View
            className="mt-8 items-center rounded-2xl py-12"
            style={{ backgroundColor: palet.yuzey, ...SHADOWS.yumusak }}
          >
            <Text style={{ fontSize: 40 }}>✨</Text>
            <Text className="mt-3 font-bold" style={{ color: palet.metin }}>
              {gorunum === "yapilacak"
                ? "Henüz hayal eklenmemiş"
                : "Henüz tamamlanan yok"}
            </Text>
            <Text className="mt-1" style={{ color: palet.metinIkincil }}>
              + ile ilk hayalinizi ekleyin
            </Text>
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={() => setModalAcik(true)}
        className="absolute h-16 w-16 items-center justify-center rounded-full"
        style={{
          right: 24,
          bottom: 28,
          backgroundColor: palet.primary,
          ...SHADOWS.kart,
        }}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </Pressable>

      <BucketFormModal
        visible={modalAcik}
        onClose={() => setModalAcik(false)}
        onKaydet={addItem}
      />

      <BucketKutlama
        visible={kutlama.visible}
        baslik={kutlama.baslik}
        onKapat={() => setKutlama({ visible: false, baslik: "" })}
      />
    </SafeAreaView>
  );
}

function FiltreChip({
  etiket,
  aktif,
  onPress,
}: {
  etiket: string;
  aktif: boolean;
  onPress: () => void;
}) {
  const palet = usePalet();
  return (
    <Pressable
      onPress={onPress}
      className="rounded-full px-3 py-2"
      style={{
        backgroundColor: aktif ? `${palet.primary}22` : palet.yuzey,
        borderWidth: aktif ? 1 : 0,
        borderColor: palet.primary,
      }}
    >
      <Text
        className="text-sm font-semibold"
        style={{ color: aktif ? palet.primary : palet.metinIkincil }}
      >
        {etiket}
      </Text>
    </Pressable>
  );
}
