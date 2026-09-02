// ====================================================================
// SurprizlerBolumu — mevcut sürpriz özelliği (değiştirilmeden taşındı)
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
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

import { SurprizFormModal, SurprizFormVerisi } from "@/components/surprise/SurprizFormModal";
import { SurprizKarti } from "@/components/surprise/SurprizKarti";
import { RADIUS, SHADOWS } from "@/constants/theme";
import { Surprise, useSurpriseStore } from "@/store/surpriseStore";
import { usePalet } from "@/store/useThemeStore";

export function SurprizlerBolumu() {
  const palet = usePalet();

  const surprises = useSurpriseStore((s) => s.surprises);
  const addSurprise = useSurpriseStore((s) => s.addSurprise);
  const openSurprise = useSurpriseStore((s) => s.openSurprise);
  const deleteSurprise = useSurpriseStore((s) => s.deleteSurprise);
  const acilabilirMi = useSurpriseStore((s) => s.acilabilirMi);
  const openByType = useSurpriseStore((s) => s.openByType);
  const fetchSurprises = useSurpriseStore((s) => s.fetchSurprises);
  const loading = useSurpriseStore((s) => s.loading);
  const yuklendiMi = useSurpriseStore((s) => s.yuklendiMi);

  const [modalAcik, setModalAcik] = useState(false);

  const sirali = useMemo(() => {
    const rutbe = (s: Surprise) => {
      if (s.isOpened) return 2;
      if (acilabilirMi(s)) return 0;
      return 1;
    };
    return [...surprises].sort((a, b) => rutbe(a) - rutbe(b));
  }, [surprises, acilabilirMi]);

  const kaydet = async (veri: SurprizFormVerisi) => {
    const yeni = await addSurprise(veri);
    if (!yeni) {
      Alert.alert(
        "Kaydedilemedi",
        "Sürpriz buluta kaydedilemedi. İnternet bağlantını kontrol edip tekrar dene."
      );
      return;
    }
    setModalAcik(false);
  };

  const hizliAc = async (tip: "sad" | "miss") => {
    const acilan = await openByType(tip);
    if (!acilan) {
      Alert.alert(
        tip === "sad" ? "Şu an için sürpriz yok 💙" : "Şu an için sürpriz yok 🥺",
        tip === "sad"
          ? "Bu duruma özel sakladığım bir sürpriz kalmadı ama unutma: her zaman buradayım. 💕"
          : "Bu duruma özel bir sürprizim kalmadı ama ben de seni özlüyorum. 💕"
      );
    }
  };

  const bosDurum = surprises.length === 0;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        refreshControl={
          <RefreshControl
            refreshing={loading && yuklendiMi}
            onRefresh={fetchSurprises}
            tintColor={palet.primary}
            colors={[palet.primary]}
          />
        }
      >
        {!yuklendiMi && loading ? (
          <View className="items-center py-6">
            <ActivityIndicator color={palet.primary} />
            <Text className="mt-2" style={{ color: palet.metinIkincil }}>
              Sürprizler yükleniyor 💕
            </Text>
          </View>
        ) : null}

        <View className="mb-5 flex-row gap-3">
          <Pressable
            onPress={() => hizliAc("sad")}
            className="flex-1 items-center rounded-2xl py-4"
            style={{ backgroundColor: "#5B9BD5", ...SHADOWS.yumusak }}
          >
            <Text className="text-2xl">💙</Text>
            <Text className="mt-1 text-center text-sm font-bold text-white">Kötü hissediyorum</Text>
          </Pressable>
          <Pressable
            onPress={() => hizliAc("miss")}
            className="flex-1 items-center rounded-2xl py-4"
            style={{ backgroundColor: palet.primary, ...SHADOWS.yumusak }}
          >
            <Text className="text-2xl">🥺</Text>
            <Text className="mt-1 text-center text-sm font-bold text-white">Seni özledim</Text>
          </Pressable>
        </View>

        {bosDurum ? (
          <View
            className="mt-2 items-center px-8 py-12"
            style={{ backgroundColor: palet.yuzey, borderRadius: RADIUS.lg, ...SHADOWS.yumusak }}
          >
            <Text style={{ fontSize: 52 }}>🎁💕</Text>
            <Text className="mt-4 text-center text-lg font-bold" style={{ color: palet.metin }}>
              Henüz bir sürpriz yok
            </Text>
            <Text className="mt-2 text-center" style={{ color: palet.metinIkincil }}>
              Aşağıdaki + butonuna dokunarak sevdiğin için gizli bir sürpriz saklayabilirsin.
            </Text>
          </View>
        ) : (
          <View className="gap-4">
            {sirali.map((s) => (
              <SurprizKarti
                key={s.id}
                surprise={s}
                acilabilir={acilabilirMi(s)}
                onOpen={(x) => openSurprise(x.id)}
                onDelete={(x) => deleteSurprise(x.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={() => setModalAcik(true)}
        className="absolute h-14 w-14 items-center justify-center rounded-full"
        style={{ right: 4, bottom: 8, backgroundColor: palet.primary, ...SHADOWS.kart }}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>

      <SurprizFormModal visible={modalAcik} onClose={() => setModalAcik(false)} onKaydet={kaydet} />
    </View>
  );
}
