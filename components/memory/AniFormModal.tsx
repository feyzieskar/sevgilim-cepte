// ====================================================================
// AniFormModal
// ====================================================================
// Anı EKLEME ve DÜZENLEME formu (alttan açılan modal).
// Alanlar: fotoğraf (galeri/kamera), tarih (inline takvim), not,
// konum (yer adı + "konumumu kullan").
// Modal yalnızca veriyi toplar; kaydetme işini ekran yapar.
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";

import { AYLAR, GUNLER, bugunISO, tarihUzun } from "@/constants/tarih";
import { RADIUS } from "@/constants/theme";
import { galeridenSec, kameradanCek, mevcutKonum } from "@/services/media";
import type { Memory, MemoryGirdi } from "@/store/memoryStore";
import { usePalet, useThemeStore } from "@/store/useThemeStore";

// Takvimi Türkçeleştir (modül yüklenince bir kez)
LocaleConfig.locales.tr = {
  monthNames: AYLAR,
  monthNamesShort: AYLAR.map((a) => a.slice(0, 3)),
  dayNames: GUNLER,
  dayNamesShort: ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"],
  today: "Bugün",
};
LocaleConfig.defaultLocale = "tr";

// Formdan dışarı verilen veri (id yönetimi ekranda).
// Yeni fotoğraf seçildiyse photoBase64 da taşınır (Storage'a yüklenir).
export type AniFormVerisi = MemoryGirdi;

interface AniFormModalProps {
  visible: boolean;
  onClose: () => void;
  duzenlenen?: Memory | null;
  // Kaydetme async olabilir (fotoğraf yükleme); modal sırasında spinner gösterilir
  onKaydet: (veri: AniFormVerisi) => void | Promise<void>;
}

export function AniFormModal({
  visible,
  onClose,
  duzenlenen,
  onKaydet,
}: AniFormModalProps) {
  const palet = usePalet();
  const mod = useThemeStore((s) => s.mod);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  // Yeni seçilen fotoğrafın base64'ü (yalnızca yeni seçimde dolar)
  const [photoBase64, setPhotoBase64] = useState<string | undefined>();
  const [date, setDate] = useState(bugunISO());
  const [note, setNote] = useState("");
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [takvimAcik, setTakvimAcik] = useState(false);
  const [konumYukleniyor, setKonumYukleniyor] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  // Modal her açıldığında formu uygun değerlerle doldur
  useEffect(() => {
    if (!visible) return;
    if (duzenlenen) {
      setPhotoUri(duzenlenen.photoUri);
      setDate(duzenlenen.date);
      setNote(duzenlenen.note);
      setLocationName(duzenlenen.locationName ?? "");
      setLatitude(duzenlenen.latitude);
      setLongitude(duzenlenen.longitude);
    } else {
      setPhotoUri(null);
      setDate(bugunISO());
      setNote("");
      setLocationName("");
      setLatitude(undefined);
      setLongitude(undefined);
    }
    setPhotoBase64(undefined);
    setTakvimAcik(false);
    setKaydediliyor(false);
    setHata(null);
  }, [visible, duzenlenen]);

  // Fotoğraf seç (galeri)
  const galeri = async () => {
    const foto = await galeridenSec();
    if (foto) {
      setPhotoUri(foto.uri);
      setPhotoBase64(foto.base64);
    }
  };

  // Fotoğraf çek (kamera)
  const kamera = async () => {
    const foto = await kameradanCek();
    if (foto) {
      setPhotoUri(foto.uri);
      setPhotoBase64(foto.base64);
    }
  };

  // Mevcut konumu al
  const konumAl = async () => {
    setKonumYukleniyor(true);
    const k = await mevcutKonum();
    setKonumYukleniyor(false);
    if (k) {
      setLatitude(k.latitude);
      setLongitude(k.longitude);
      if (k.locationName && locationName.trim() === "") {
        setLocationName(k.locationName);
      }
    } else {
      setHata("Konum alınamadı. İzni kontrol et.");
    }
  };

  const kaydet = async () => {
    if (!photoUri) {
      setHata("Lütfen bir fotoğraf seç 📸");
      return;
    }
    // Yeni anıda mutlaka base64 (yüklenecek fotoğraf) olmalı
    if (!duzenlenen && !photoBase64) {
      setHata("Fotoğraf okunamadı, lütfen tekrar seç 📸");
      return;
    }
    setHata(null);
    setKaydediliyor(true);
    try {
      await onKaydet({
        photoUri,
        photoBase64,
        date,
        note: note.trim(),
        isFavorite: duzenlenen?.isFavorite ?? false,
        locationName:
          locationName.trim() === "" ? undefined : locationName.trim(),
        latitude,
        longitude,
      });
    } finally {
      setKaydediliyor(false);
    }
  };

  const inputStyle = {
    backgroundColor: palet.yuzeyIkincil,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: palet.kenarlik,
    color: palet.metin,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  } as const;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View
            style={{
              backgroundColor: palet.yuzey,
              borderTopLeftRadius: RADIUS.lg,
              borderTopRightRadius: RADIUS.lg,
              maxHeight: "92%",
            }}
          >
            {/* Başlık çubuğu */}
            <View className="flex-row items-center justify-between px-5 pb-3 pt-5">
              <Text className="text-xl font-bold" style={{ color: palet.metin }}>
                {duzenlenen ? "Anıyı Düzenle" : "Yeni Anı"}
              </Text>
              <Pressable onPress={onClose} hitSlop={10}>
                <Ionicons name="close-circle" size={28} color={palet.metinIkincil} />
              </Pressable>
            </View>

            <ScrollView
              className="px-5"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Fotoğraf alanı */}
              {photoUri ? (
                <Image
                  source={{ uri: photoUri }}
                  style={{ width: "100%", height: 200, borderRadius: RADIUS.md }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  className="items-center justify-center"
                  style={{
                    height: 200,
                    borderRadius: RADIUS.md,
                    backgroundColor: palet.yuzeyIkincil,
                    borderWidth: 2,
                    borderStyle: "dashed",
                    borderColor: palet.kenarlik,
                  }}
                >
                  <Ionicons name="image-outline" size={40} color={palet.metinIkincil} />
                  <Text className="mt-2" style={{ color: palet.metinIkincil }}>
                    Henüz fotoğraf seçilmedi
                  </Text>
                </View>
              )}

              {/* Fotoğraf butonları */}
              <View className="mt-3 flex-row gap-3">
                <Pressable
                  onPress={galeri}
                  className="flex-1 flex-row items-center justify-center rounded-2xl py-3"
                  style={{ backgroundColor: palet.yuzeyIkincil }}
                >
                  <Ionicons name="images" size={18} color={palet.primary} />
                  <Text className="ml-2 font-semibold" style={{ color: palet.metin }}>
                    Galeri
                  </Text>
                </Pressable>
                <Pressable
                  onPress={kamera}
                  className="flex-1 flex-row items-center justify-center rounded-2xl py-3"
                  style={{ backgroundColor: palet.yuzeyIkincil }}
                >
                  <Ionicons name="camera" size={18} color={palet.primary} />
                  <Text className="ml-2 font-semibold" style={{ color: palet.metin }}>
                    Kamera
                  </Text>
                </Pressable>
              </View>

              {/* Tarih seçici */}
              <Text className="mb-2 mt-4 font-semibold" style={{ color: palet.metinIkincil }}>
                Tarih
              </Text>
              <Pressable
                onPress={() => setTakvimAcik((a) => !a)}
                className="flex-row items-center justify-between rounded-2xl px-4 py-3"
                style={{ backgroundColor: palet.yuzeyIkincil }}
              >
                <View className="flex-row items-center">
                  <Ionicons name="calendar" size={18} color={palet.primary} />
                  <Text className="ml-2 font-semibold" style={{ color: palet.metin }}>
                    {tarihUzun(date)}
                  </Text>
                </View>
                <Ionicons
                  name={takvimAcik ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={palet.metinIkincil}
                />
              </Pressable>

              {takvimAcik ? (
                <View className="mt-2" style={{ borderRadius: RADIUS.md, overflow: "hidden" }}>
                  <Calendar
                    key={mod}
                    current={date}
                    onDayPress={(g) => {
                      setDate(g.dateString);
                      setTakvimAcik(false);
                    }}
                    markedDates={{ [date]: { selected: true, selectedColor: palet.primary } }}
                    firstDay={1}
                    theme={{
                      calendarBackground: palet.yuzey,
                      monthTextColor: palet.metin,
                      dayTextColor: palet.metin,
                      textDisabledColor: palet.metinIkincil + "66",
                      todayTextColor: palet.primary,
                      selectedDayBackgroundColor: palet.primary,
                      selectedDayTextColor: "#FFFFFF",
                      arrowColor: palet.primary,
                      textSectionTitleColor: palet.metinIkincil,
                    }}
                  />
                </View>
              ) : null}

              {/* Not */}
              <Text className="mb-2 mt-4 font-semibold" style={{ color: palet.metinIkincil }}>
                Not
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="O an ne hissettin? 💭"
                placeholderTextColor={palet.metinIkincil}
                multiline
                numberOfLines={3}
                style={[inputStyle, { minHeight: 80, textAlignVertical: "top" }]}
              />

              {/* Konum */}
              <Text className="mb-2 mt-4 font-semibold" style={{ color: palet.metinIkincil }}>
                Konum (opsiyonel)
              </Text>
              <TextInput
                value={locationName}
                onChangeText={setLocationName}
                placeholder="Örn. Kapadokya"
                placeholderTextColor={palet.metinIkincil}
                style={inputStyle}
              />
              <Pressable
                onPress={konumAl}
                disabled={konumYukleniyor}
                className="mt-2 flex-row items-center justify-center rounded-2xl py-3"
                style={{ backgroundColor: palet.yuzeyIkincil }}
              >
                {konumYukleniyor ? (
                  <ActivityIndicator size="small" color={palet.primary} />
                ) : (
                  <Ionicons name="location" size={18} color={palet.primary} />
                )}
                <Text className="ml-2 font-semibold" style={{ color: palet.metin }}>
                  {latitude != null ? "Konum eklendi ✓" : "Konumumu kullan"}
                </Text>
              </Pressable>

              {/* Hata mesajı */}
              {hata ? (
                <Text className="mt-3 text-center" style={{ color: "#E14D80" }}>
                  {hata}
                </Text>
              ) : null}

              {/* Kaydet butonu */}
              <Pressable
                onPress={kaydet}
                disabled={kaydediliyor}
                className="mb-8 mt-5 items-center rounded-2xl py-4"
                style={{ backgroundColor: palet.primary, opacity: kaydediliyor ? 0.7 : 1 }}
              >
                {kaydediliyor ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text className="ml-2 text-lg font-bold text-white">
                      Yükleniyor…
                    </Text>
                  </View>
                ) : (
                  <Text className="text-lg font-bold text-white">
                    {duzenlenen ? "Güncelle" : "Kaydet"}
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
