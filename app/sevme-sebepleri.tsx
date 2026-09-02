// ====================================================================
// SEVME SEBEPLERİ EKRANI
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EkranBasligi } from "@/components/ui/EkranBasligi";
import { gununElemaniniSec } from "@/constants/gunlukSecim";
import { GRADIENTS, RADIUS, SHADOWS } from "@/constants/theme";
import { SEVME_SEBEPLERI } from "@/data/sevmeSebepleri";
import { useAuthStore } from "@/store/authStore";
import { useLoveReasonStore } from "@/store/loveReasonStore";
import { usePalet } from "@/store/useThemeStore";

export default function SevmeSebepleriEkrani() {
  const palet = usePalet();
  const userId = useAuthStore((s) => s.user?.id);

  const ozelSebepler = useLoveReasonStore((s) => s.reasons);
  const loading = useLoveReasonStore((s) => s.loading);
  const yuklendiMi = useLoveReasonStore((s) => s.yuklendiMi);
  const fetchReasons = useLoveReasonStore((s) => s.fetchReasons);
  const addReason = useLoveReasonStore((s) => s.addReason);
  const deleteReason = useLoveReasonStore((s) => s.deleteReason);

  const tumSebepler = useMemo(
    () => [...SEVME_SEBEPLERI, ...ozelSebepler.map((r) => r.text)],
    [ozelSebepler]
  );

  const [bugununSebebi, setBugununSebebi] = useState(() => gununElemaniniSec(tumSebepler) ?? "");
  const [yeniMetin, setYeniMetin] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hazirAcik, setHazirAcik] = useState(false);

  useEffect(() => {
    if (!yuklendiMi) void fetchReasons();
  }, [yuklendiMi, fetchReasons]);

  const rastgeleSebep = () => {
    if (tumSebepler.length === 0) return;
    const rastgele = tumSebepler[Math.floor(Math.random() * tumSebepler.length)];
    setBugununSebebi(rastgele);
  };

  const sebepEkle = async () => {
    const temiz = yeniMetin.trim();
    if (temiz === "") return;
    setKaydediliyor(true);
    const eklenen = await addReason(temiz);
    setKaydediliyor(false);
    if (eklenen) {
      setYeniMetin("");
      setBugununSebebi(eklenen.text);
    } else {
      Alert.alert("Kaydedilemedi", "Sebep eklenirken bir sorun oluştu.");
    }
  };

  const sebepSil = (id: string, metin: string) => {
    Alert.alert("Sil", "Bu sebep listeden silinsin mi?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: () => deleteReason(id),
      },
    ]);
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: palet.arkaplan }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={loading && yuklendiMi}
            onRefresh={fetchReasons}
            tintColor={palet.primary}
            colors={[palet.primary]}
          />
        }
      >
        <EkranBasligi baslik="Sevme Sebepleri" altBaslik="Seni neden seviyorum? 💝" geriDugmesi />

        {/* Bugünün sebebi */}
        <LinearGradient
          colors={GRADIENTS.gunbatimi}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            marginTop: 8,
            borderRadius: RADIUS.lg,
            padding: 20,
            ...SHADOWS.kart,
          }}
        >
          <View className="flex-row items-center justify-between">
            <Text
              className="text-sm font-semibold uppercase text-white"
              style={{ letterSpacing: 1, opacity: 0.95 }}
            >
              Bugün Seni Sevme Sebebim
            </Text>
            <Pressable
              onPress={rastgeleSebep}
              hitSlop={10}
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
            >
              <Ionicons name="heart" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
          <Text className="mt-4 text-xl font-semibold leading-7 text-white">{bugununSebebi}</Text>
          <Text className="mt-3 text-xs text-white" style={{ opacity: 0.85 }}>
            Yeni bir sebep için kalbe dokun 💗
          </Text>
        </LinearGradient>

        {/* Yeni sebep ekle */}
        <View
          className="mt-5 rounded-2xl p-4"
          style={{ backgroundColor: palet.yuzey, ...SHADOWS.yumusak }}
        >
          <Text className="mb-3 text-lg font-bold" style={{ color: palet.metin }}>
            Yeni Sebep Ekle
          </Text>
          <View className="flex-row items-end">
            <TextInput
              value={yeniMetin}
              onChangeText={setYeniMetin}
              placeholder="Seni şu yüzden seviyorum..."
              placeholderTextColor={palet.metinIkincil}
              multiline
              style={{
                flex: 1,
                maxHeight: 100,
                backgroundColor: palet.yuzeyIkincil,
                borderRadius: RADIUS.md,
                color: palet.metin,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 16,
                textAlignVertical: "top",
              }}
            />
            <Pressable
              onPress={sebepEkle}
              disabled={kaydediliyor || yeniMetin.trim() === ""}
              className="ml-2 h-12 w-12 items-center justify-center rounded-full"
              style={{
                backgroundColor: yeniMetin.trim() === "" ? palet.kenarlik : palet.primary,
              }}
            >
              {kaydediliyor ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="add" size={24} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
        </View>

        {/* Özel sebepler */}
        <View className="mt-5">
          <Text className="mb-3 text-lg font-bold" style={{ color: palet.metin }}>
            Bizim Sebeplerimiz ({ozelSebepler.length})
          </Text>

          {!yuklendiMi && loading ? (
            <ActivityIndicator color={palet.primary} />
          ) : ozelSebepler.length > 0 ? (
            <View className="gap-2">
              {ozelSebepler.map((r) => (
                <View
                  key={r.id}
                  className="flex-row items-center rounded-2xl px-4 py-3"
                  style={{ backgroundColor: palet.yuzey, ...SHADOWS.yumusak }}
                >
                  <Text className="mr-2 text-lg">💝</Text>
                  <View className="flex-1">
                    <Text style={{ color: palet.metin }}>{r.text}</Text>
                    <Text className="mt-0.5 text-xs" style={{ color: palet.metinIkincil }}>
                      {r.createdBy === userId ? "Sen ekledin" : "Partner ekledi"}
                    </Text>
                  </View>
                  <Pressable onPress={() => sebepSil(r.id, r.text)} hitSlop={8} className="p-1">
                    <Ionicons name="trash-outline" size={20} color="#E14D80" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <View
              className="items-center rounded-2xl py-8"
              style={{ backgroundColor: palet.yuzey, ...SHADOWS.yumusak }}
            >
              <Text style={{ color: palet.metinIkincil }}>
                Henüz kendi sebebinizi eklemediniz. İlkini yazın 💌
              </Text>
            </View>
          )}
        </View>

        {/* Hazır sebepler */}
        <View className="mt-5">
          <Pressable
            onPress={() => setHazirAcik((x) => !x)}
            className="flex-row items-center justify-between rounded-2xl px-4 py-3"
            style={{ backgroundColor: palet.yuzey, ...SHADOWS.yumusak }}
          >
            <Text className="font-bold" style={{ color: palet.metin }}>
              Hazır Sebepler ({SEVME_SEBEPLERI.length})
            </Text>
            <Ionicons
              name={hazirAcik ? "chevron-up" : "chevron-down"}
              size={20}
              color={palet.metinIkincil}
            />
          </Pressable>

          {hazirAcik ? (
            <View className="mt-2 gap-2">
              {SEVME_SEBEPLERI.map((metin, i) => (
                <Pressable
                  key={`${i}-${metin.slice(0, 12)}`}
                  onPress={() => setBugununSebebi(metin)}
                  className="rounded-xl px-4 py-3"
                  style={{ backgroundColor: palet.yuzeyIkincil }}
                >
                  <Text style={{ color: palet.metin }}>{metin}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
