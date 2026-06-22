// ====================================================================
// SurprizFormModal  (Admin: Sürpriz Ekle)
// ====================================================================
// Yeni sürpriz oluşturma formu (alttan açılan modal).
// Alanlar: başlık, mesaj, fotoğraf (opsiyonel), açılma tipi seçici,
// (date/before_trip ise) tarih seçici.
// Modal yalnızca veriyi toplar; kaydetme işini ekran yapar.
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
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

import { UNLOCK_LISTESI, UnlockType } from "@/constants/surpriz";
import { AYLAR, GUNLER, bugunISO, tarihUzun } from "@/constants/tarih";
import { RADIUS } from "@/constants/theme";
import { galeridenSec } from "@/services/media";
import type { Surprise } from "@/store/surpriseStore";
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

// Formdan dışarı verilen veri (id/isOpened/openedAt yönetimi store'da)
export type SurprizFormVerisi = Omit<
  Surprise,
  "id" | "isOpened" | "openedAt"
>;

interface SurprizFormModalProps {
  visible: boolean;
  onClose: () => void;
  onKaydet: (veri: SurprizFormVerisi) => void;
}

export function SurprizFormModal({
  visible,
  onClose,
  onKaydet,
}: SurprizFormModalProps) {
  const palet = usePalet();
  const mod = useThemeStore((s) => s.mod);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [unlockType, setUnlockType] = useState<UnlockType>("date");
  const [unlockDate, setUnlockDate] = useState(bugunISO());
  const [takvimAcik, setTakvimAcik] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  // Modal her açıldığında formu sıfırla
  useEffect(() => {
    if (!visible) return;
    setTitle("");
    setContent("");
    setPhotoUri(null);
    setUnlockType("date");
    setUnlockDate(bugunISO());
    setTakvimAcik(false);
    setHata(null);
  }, [visible]);

  // Seçili tipin tarih gerektirip gerektirmediği
  const tarihGerekir =
    UNLOCK_LISTESI.find((t) => t.tip === unlockType)?.tarihGerekir ?? false;

  const fotografSec = async () => {
    const uri = await galeridenSec();
    if (uri) setPhotoUri(uri);
  };

  const kaydet = () => {
    if (title.trim() === "") {
      setHata("Lütfen bir başlık gir 🎁");
      return;
    }
    if (content.trim() === "") {
      setHata("Lütfen sürpriz mesajını yaz 💌");
      return;
    }

    onKaydet({
      title: title.trim(),
      content: content.trim(),
      photoUri: photoUri ?? undefined,
      unlockType,
      unlockDate: tarihGerekir ? unlockDate : undefined,
    });
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
                Yeni Sürpriz 🎁
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
              {/* Başlık */}
              <Text className="mb-2 font-semibold" style={{ color: palet.metinIkincil }}>
                Başlık
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Örn. Doğum günün için 🎂"
                placeholderTextColor={palet.metinIkincil}
                style={inputStyle}
              />

              {/* Mesaj */}
              <Text className="mb-2 mt-4 font-semibold" style={{ color: palet.metinIkincil }}>
                Mesaj
              </Text>
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Kalbinden geçeni yaz... 💌"
                placeholderTextColor={palet.metinIkincil}
                multiline
                numberOfLines={4}
                style={[inputStyle, { minHeight: 110, textAlignVertical: "top" }]}
              />

              {/* Fotoğraf (opsiyonel) */}
              <Text className="mb-2 mt-4 font-semibold" style={{ color: palet.metinIkincil }}>
                Fotoğraf (opsiyonel)
              </Text>
              {photoUri ? (
                <View>
                  <Image
                    source={{ uri: photoUri }}
                    style={{ width: "100%", height: 160, borderRadius: RADIUS.md }}
                    resizeMode="cover"
                  />
                  <Pressable
                    onPress={() => setPhotoUri(null)}
                    className="absolute right-2 top-2 h-9 w-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                  >
                    <Ionicons name="trash" size={18} color="#FFFFFF" />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={fotografSec}
                  className="flex-row items-center justify-center rounded-2xl py-3"
                  style={{ backgroundColor: palet.yuzeyIkincil }}
                >
                  <Ionicons name="image" size={18} color={palet.primary} />
                  <Text className="ml-2 font-semibold" style={{ color: palet.metin }}>
                    Galeriden seç
                  </Text>
                </Pressable>
              )}

              {/* Açılma tipi seçici */}
              <Text className="mb-2 mt-4 font-semibold" style={{ color: palet.metinIkincil }}>
                Ne zaman açılsın?
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {UNLOCK_LISTESI.map((t) => {
                  const aktif = t.tip === unlockType;
                  return (
                    <Pressable
                      key={t.tip}
                      onPress={() => setUnlockType(t.tip)}
                      className="flex-row items-center rounded-full px-4 py-2"
                      style={{
                        backgroundColor: aktif ? t.renk : palet.yuzeyIkincil,
                        borderWidth: 1,
                        borderColor: aktif ? t.renk : palet.kenarlik,
                      }}
                    >
                      <Ionicons
                        name={t.ikon}
                        size={15}
                        color={aktif ? "#FFFFFF" : t.renk}
                      />
                      <Text
                        className="ml-1.5 text-sm font-semibold"
                        style={{ color: aktif ? "#FFFFFF" : palet.metin }}
                      >
                        {t.etiket}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Tarih seçici (sadece date / before_trip için) */}
              {tarihGerekir ? (
                <>
                  <Text className="mb-2 mt-4 font-semibold" style={{ color: palet.metinIkincil }}>
                    {unlockType === "before_trip"
                      ? "Hedef tatil tarihi (bilgi amaçlı)"
                      : "Açılma tarihi"}
                  </Text>
                  <Pressable
                    onPress={() => setTakvimAcik((a) => !a)}
                    className="flex-row items-center justify-between rounded-2xl px-4 py-3"
                    style={{ backgroundColor: palet.yuzeyIkincil }}
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="calendar" size={18} color={palet.primary} />
                      <Text className="ml-2 font-semibold" style={{ color: palet.metin }}>
                        {tarihUzun(unlockDate)}
                      </Text>
                    </View>
                    <Ionicons
                      name={takvimAcik ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={palet.metinIkincil}
                    />
                  </Pressable>

                  {unlockType === "before_trip" ? (
                    <Text className="mt-1 text-xs" style={{ color: palet.metinIkincil }}>
                      Not: Bu tip, takvimdeki en yakın "tatil" etkinliğine 3 gün
                      kala otomatik açılabilir olur.
                    </Text>
                  ) : null}

                  {takvimAcik ? (
                    <View className="mt-2" style={{ borderRadius: RADIUS.md, overflow: "hidden" }}>
                      <Calendar
                        key={mod}
                        current={unlockDate}
                        onDayPress={(g) => {
                          setUnlockDate(g.dateString);
                          setTakvimAcik(false);
                        }}
                        markedDates={{
                          [unlockDate]: { selected: true, selectedColor: palet.primary },
                        }}
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
                </>
              ) : null}

              {/* Hata mesajı */}
              {hata ? (
                <Text className="mt-3 text-center" style={{ color: "#E14D80" }}>
                  {hata}
                </Text>
              ) : null}

              {/* Kaydet butonu */}
              <Pressable
                onPress={kaydet}
                className="mb-8 mt-5 items-center rounded-2xl py-4"
                style={{ backgroundColor: palet.primary }}
              >
                <Text className="text-lg font-bold text-white">Sürprizi Sakla</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
