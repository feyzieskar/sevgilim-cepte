// ====================================================================
// SevmeSebebiKarti  (Ana ekran kartı #5)
// ====================================================================
// "Bugün Seni Sevme Sebebim": her gün listeden sıralı bir sebep gösterir.
// Liste = yerleşik sebepler (data/sevmeSebepleri.ts) + çiftin Supabase'e
// eklediği ÖZEL sebepler (love_reasons, partnerle ortak). Kalbe basınca
// rastgele sebep gelir; kalem ikonuyla özel sebepler eklenip silinebilir.
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { GradientCard } from "@/components/ui/GradientCard";
import { gununElemaniniSec } from "@/constants/gunlukSecim";
import { RADIUS } from "@/constants/theme";
import { SEVME_SEBEPLERI } from "@/data/sevmeSebepleri";
import { useLoveReasonStore } from "@/store/loveReasonStore";
import { usePalet } from "@/store/useThemeStore";

export function SevmeSebebiKarti() {
  const palet = usePalet();
  const ozelSebepler = useLoveReasonStore((s) => s.reasons);
  const addReason = useLoveReasonStore((s) => s.addReason);
  const deleteReason = useLoveReasonStore((s) => s.deleteReason);

  // Yerleşik + özel sebepler birleşik liste
  const tumSebepler = useMemo(
    () => [...SEVME_SEBEPLERI, ...ozelSebepler.map((r) => r.text)],
    [ozelSebepler]
  );

  // Varsayılan: bugüne karşılık gelen sebep
  const [sebep, setSebep] = useState(
    () => gununElemaniniSec(SEVME_SEBEPLERI) ?? ""
  );

  const [modalAcik, setModalAcik] = useState(false);
  const [yeniMetin, setYeniMetin] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);

  // Kalbe basınca rastgele başka bir sebep göster
  const yeniSebep = () => {
    if (tumSebepler.length === 0) return;
    const rastgele =
      tumSebepler[Math.floor(Math.random() * tumSebepler.length)];
    setSebep(rastgele);
  };

  const sebepEkle = async () => {
    const temiz = yeniMetin.trim();
    if (temiz === "") return;
    setKaydediliyor(true);
    const eklenen = await addReason(temiz);
    setKaydediliyor(false);
    if (eklenen) {
      setYeniMetin("");
      setSebep(eklenen.text); // Yeni eklenen sebebi karta yansıt
    }
  };

  return (
    <>
      <GradientCard gradient gradientTipi="gunbatimi">
        <View className="flex-row items-center justify-between">
          <Text
            className="text-sm font-semibold uppercase text-white"
            style={{ letterSpacing: 1, opacity: 0.95 }}
          >
            Bugün Seni Sevme Sebebim
          </Text>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setModalAcik(true)}
              hitSlop={10}
              className="h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
            >
              <Ionicons name="create-outline" size={18} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={yeniSebep}
              hitSlop={10}
              className="h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
            >
              <Ionicons name="heart" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        <Text className="mt-3 text-xl font-semibold leading-7 text-white">
          {sebep}
        </Text>

        <Text className="mt-3 text-xs text-white" style={{ opacity: 0.85 }}>
          Yeni bir sebep için kalbe dokun 💗
        </Text>
      </GradientCard>

      {/* Özel sebepleri yönetme modalı */}
      <Modal
        visible={modalAcik}
        animationType="slide"
        transparent
        onRequestClose={() => setModalAcik(false)}
      >
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View
              style={{
                backgroundColor: palet.yuzey,
                borderTopLeftRadius: RADIUS.lg,
                borderTopRightRadius: RADIUS.lg,
                maxHeight: "85%",
              }}
            >
              {/* Başlık çubuğu */}
              <View className="flex-row items-center justify-between px-5 pb-3 pt-5">
                <Text
                  className="text-xl font-bold"
                  style={{ color: palet.metin }}
                >
                  Sevme Sebeplerimiz 💕
                </Text>
                <Pressable onPress={() => setModalAcik(false)} hitSlop={10}>
                  <Ionicons
                    name="close-circle"
                    size={28}
                    color={palet.metinIkincil}
                  />
                </Pressable>
              </View>

              {/* Yeni sebep ekleme alanı */}
              <View className="flex-row items-end px-5">
                <TextInput
                  value={yeniMetin}
                  onChangeText={setYeniMetin}
                  placeholder="Yeni bir sebep yaz... 💗"
                  placeholderTextColor={palet.metinIkincil}
                  multiline
                  style={{
                    flex: 1,
                    maxHeight: 110,
                    backgroundColor: palet.yuzeyIkincil,
                    borderRadius: RADIUS.md,
                    borderWidth: 1,
                    borderColor: palet.kenarlik,
                    color: palet.metin,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: 16,
                  }}
                />
                <Pressable
                  onPress={sebepEkle}
                  disabled={kaydediliyor || yeniMetin.trim() === ""}
                  className="ml-2 h-12 w-12 items-center justify-center rounded-full"
                  style={{
                    backgroundColor:
                      yeniMetin.trim() === "" ? palet.kenarlik : palet.primary,
                  }}
                >
                  {kaydediliyor ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="add" size={24} color="#FFFFFF" />
                  )}
                </Pressable>
              </View>

              {/* Özel sebepler listesi */}
              <ScrollView
                className="mt-4 px-5"
                contentContainerStyle={{ paddingBottom: 32 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {ozelSebepler.length === 0 ? (
                  <Text
                    className="py-6 text-center"
                    style={{ color: palet.metinIkincil }}
                  >
                    Henüz kendi sebebinizi eklemediniz. İlkini yazın 💌
                  </Text>
                ) : (
                  ozelSebepler.map((r) => (
                    <View
                      key={r.id}
                      className="mb-2 flex-row items-center justify-between rounded-2xl px-4 py-3"
                      style={{ backgroundColor: palet.yuzeyIkincil }}
                    >
                      <Text
                        className="flex-1 pr-3"
                        style={{ color: palet.metin }}
                      >
                        {r.text}
                      </Text>
                      <Pressable
                        onPress={() => deleteReason(r.id)}
                        hitSlop={8}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#E14D80"
                        />
                      </Pressable>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}
