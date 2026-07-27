// ====================================================================
// OzelGunFormModal  (Bize Özel Gün: Ekle / Düzenle)
// ====================================================================
// Tekrar eden özel günleri (yıldönümü, doğum günü...) oluşturma ve
// DÜZENLEME formu. Yıl tutulmaz; sadece gün + ay seçilir. Başlık, emoji
// ve tarih düzenlenebilir. Kaydetme işini ekran/store yapar.
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
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
import { Calendar, LocaleConfig } from "react-native-calendars";

import { AYLAR, GUNLER } from "@/constants/tarih";
import { RADIUS } from "@/constants/theme";
import type { OzelGun } from "@/data/ozelGunler";
import type { OzelGunGirdi } from "@/store/ozelGunStore";
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

const EMOJILER = [
  "💕", "💘", "🎂", "🎉", "🌹", "💍",
  "❤️", "🌟", "🎁", "✈️", "🏖️", "🏡",
];

interface OzelGunFormModalProps {
  visible: boolean;
  onClose: () => void;
  duzenlenen: OzelGun | null;
  onKaydet: (veri: OzelGunGirdi) => void | Promise<void>;
  onSil?: (id: string) => void | Promise<void>;
}

// ay/gun -> bu yıl için "YYYY-MM-DD" (takvim göstergesi için)
function ayGunISO(ay: number, gun: number): string {
  const yil = new Date().getFullYear();
  return `${yil}-${String(ay).padStart(2, "0")}-${String(gun).padStart(2, "0")}`;
}

export function OzelGunFormModal({
  visible,
  onClose,
  duzenlenen,
  onKaydet,
  onSil,
}: OzelGunFormModalProps) {
  const palet = usePalet();
  const mod = useThemeStore((s) => s.mod);

  const [baslik, setBaslik] = useState("");
  const [emoji, setEmoji] = useState("💕");
  const [ay, setAy] = useState(new Date().getMonth() + 1);
  const [gun, setGun] = useState(new Date().getDate());
  const [takvimAcik, setTakvimAcik] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  // Modal açıldığında: düzenleme ise mevcut değerleri, değilse varsayılanları yükle
  useEffect(() => {
    if (!visible) return;
    if (duzenlenen) {
      setBaslik(duzenlenen.baslik);
      setEmoji(duzenlenen.emoji);
      setAy(duzenlenen.ay);
      setGun(duzenlenen.gun);
    } else {
      const bugun = new Date();
      setBaslik("");
      setEmoji("💕");
      setAy(bugun.getMonth() + 1);
      setGun(bugun.getDate());
    }
    setTakvimAcik(false);
    setKaydediliyor(false);
    setHata(null);
  }, [visible, duzenlenen]);

  const tarihMetni = `${gun} ${AYLAR[ay - 1]}`;

  const kaydet = async () => {
    if (baslik.trim() === "") {
      setHata("Lütfen bir başlık gir 💕");
      return;
    }
    setHata(null);
    setKaydediliyor(true);
    try {
      await onKaydet({ baslik: baslik.trim(), emoji, ay, gun });
    } finally {
      setKaydediliyor(false);
    }
  };

  const silOnayi = () => {
    if (!duzenlenen || !onSil) return;
    onSil(duzenlenen.id);
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
                {duzenlenen ? "Özel Günü Düzenle" : "Yeni Özel Gün ⭐"}
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
                value={baslik}
                onChangeText={setBaslik}
                placeholder="Örn. Tanışma Yıldönümümüz 💕"
                placeholderTextColor={palet.metinIkincil}
                style={inputStyle}
              />

              {/* Emoji seçici */}
              <Text className="mb-2 mt-4 font-semibold" style={{ color: palet.metinIkincil }}>
                Emoji
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {EMOJILER.map((e) => {
                  const aktif = e === emoji;
                  return (
                    <Pressable
                      key={e}
                      onPress={() => setEmoji(e)}
                      className="h-12 w-12 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: aktif ? palet.primary : palet.yuzeyIkincil,
                        borderWidth: 1,
                        borderColor: aktif ? palet.primary : palet.kenarlik,
                      }}
                    >
                      <Text style={{ fontSize: 22 }}>{e}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Tarih seçici (yıl önemsiz, her yıl tekrar eder) */}
              <Text className="mb-2 mt-4 font-semibold" style={{ color: palet.metinIkincil }}>
                Tarih (her yıl tekrar eder)
              </Text>
              <Pressable
                onPress={() => setTakvimAcik((a) => !a)}
                className="flex-row items-center justify-between rounded-2xl px-4 py-3"
                style={{ backgroundColor: palet.yuzeyIkincil }}
              >
                <View className="flex-row items-center">
                  <Ionicons name="calendar" size={18} color={palet.primary} />
                  <Text className="ml-2 font-semibold" style={{ color: palet.metin }}>
                    {tarihMetni}
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
                    current={ayGunISO(ay, gun)}
                    onDayPress={(g) => {
                      setAy(g.month);
                      setGun(g.day);
                      setTakvimAcik(false);
                    }}
                    markedDates={{
                      [ayGunISO(ay, gun)]: { selected: true, selectedColor: palet.primary },
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
                className="mt-5 items-center rounded-2xl py-4"
                style={{ backgroundColor: palet.primary, opacity: kaydediliyor ? 0.7 : 1 }}
              >
                {kaydediliyor ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text className="ml-2 text-lg font-bold text-white">Kaydediliyor…</Text>
                  </View>
                ) : (
                  <Text className="text-lg font-bold text-white">
                    {duzenlenen ? "Değişiklikleri Kaydet" : "Özel Günü Ekle"}
                  </Text>
                )}
              </Pressable>

              {/* Sil butonu (yalnızca düzenlemede) */}
              {duzenlenen && onSil ? (
                <Pressable
                  onPress={silOnayi}
                  disabled={kaydediliyor}
                  className="mb-8 mt-3 items-center rounded-2xl py-3"
                  style={{ backgroundColor: palet.yuzeyIkincil }}
                >
                  <Text className="font-semibold" style={{ color: "#E14D80" }}>
                    Bu özel günü sil
                  </Text>
                </Pressable>
              ) : (
                <View className="mb-8" />
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
