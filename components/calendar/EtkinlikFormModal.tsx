// ====================================================================
// EtkinlikFormModal
// ====================================================================
// Etkinlik EKLEME ve DÜZENLEME formu (alttan açılan modal).
// Alanlar: başlık, tarih (seçili gün), saat (opsiyonel), kategori,
// not, hatırlatıcı toggle.
// Modal yalnızca veriyi toplar; kaydetme/bildirim işini ekran yapar.
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { KategoriSecici } from "@/components/calendar/KategoriSecici";
import { EventCategory } from "@/constants/kategoriler";
import { RADIUS } from "@/constants/theme";
import { tarihUzun } from "@/constants/tarih";
import type { CalendarEvent } from "@/store/calendarStore";
import { usePalet } from "@/store/useThemeStore";

// Formdan dışarı verilen veri (id ve notificationId yönetimi ekranda)
export type EtkinlikFormVerisi = Omit<
  CalendarEvent,
  "id" | "notificationId"
>;

interface EtkinlikFormModalProps {
  visible: boolean;
  onClose: () => void;
  // Yeni etkinlik için varsayılan tarih (seçili gün)
  tarih: string;
  // Düzenleme modundaysa mevcut etkinlik
  duzenlenen?: CalendarEvent | null;
  onKaydet: (veri: EtkinlikFormVerisi) => void;
}

// "HH:mm" geçerli mi? (boş da geçerli sayılır)
function saatGecerliMi(deger: string): boolean {
  if (deger.trim() === "") return true;
  return /^([01]?\d|2[0-3]):([0-5]\d)$/.test(deger.trim());
}

export function EtkinlikFormModal({
  visible,
  onClose,
  tarih,
  duzenlenen,
  onKaydet,
}: EtkinlikFormModalProps) {
  const palet = usePalet();

  const [baslik, setBaslik] = useState("");
  const [saat, setSaat] = useState("");
  const [kategori, setKategori] = useState<EventCategory>("bulusma");
  const [not, setNot] = useState("");
  const [hatirlatici, setHatirlatici] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  // Modal her açıldığında formu uygun değerlerle doldur
  useEffect(() => {
    if (!visible) return;
    if (duzenlenen) {
      setBaslik(duzenlenen.title);
      setSaat(duzenlenen.time ?? "");
      setKategori(duzenlenen.category);
      setNot(duzenlenen.note ?? "");
      setHatirlatici(duzenlenen.hasReminder);
    } else {
      setBaslik("");
      setSaat("");
      setKategori("bulusma");
      setNot("");
      setHatirlatici(false);
    }
    setHata(null);
  }, [visible, duzenlenen]);

  // Düzenleme modundaysa o etkinliğin tarihini, değilse seçili günü kullan
  const hedefTarih = duzenlenen?.date ?? tarih;

  const kaydet = () => {
    if (baslik.trim() === "") {
      setHata("Lütfen bir başlık gir 💕");
      return;
    }
    if (!saatGecerliMi(saat)) {
      setHata("Saat formatı HH:mm olmalı (örn. 20:30)");
      return;
    }

    onKaydet({
      title: baslik.trim(),
      date: hedefTarih,
      time: saat.trim() === "" ? undefined : saat.trim(),
      category: kategori,
      note: not.trim() === "" ? undefined : not.trim(),
      hasReminder: hatirlatici,
    });
  };

  // Ortak input stili
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
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      {/* Yarı saydam arka plan */}
      <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={{
              backgroundColor: palet.yuzey,
              borderTopLeftRadius: RADIUS.lg,
              borderTopRightRadius: RADIUS.lg,
              maxHeight: "90%",
            }}
          >
            {/* Başlık çubuğu */}
            <View className="flex-row items-center justify-between px-5 pt-5 pb-3">
              <Text className="text-xl font-bold" style={{ color: palet.metin }}>
                {duzenlenen ? "Etkinliği Düzenle" : "Yeni Etkinlik"}
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
              {/* Tarih (seçili gün) */}
              <View
                className="mb-4 flex-row items-center rounded-2xl px-4 py-3"
                style={{ backgroundColor: palet.yuzeyIkincil }}
              >
                <Ionicons name="calendar" size={18} color={palet.primary} />
                <Text className="ml-2 font-semibold" style={{ color: palet.metin }}>
                  {tarihUzun(hedefTarih)}
                </Text>
              </View>

              {/* Başlık */}
              <Text className="mb-2 font-semibold" style={{ color: palet.metinIkincil }}>
                Başlık
              </Text>
              <TextInput
                value={baslik}
                onChangeText={setBaslik}
                placeholder="Örn. Akşam yemeği 🍝"
                placeholderTextColor={palet.metinIkincil}
                style={inputStyle}
              />

              {/* Saat */}
              <Text className="mb-2 mt-4 font-semibold" style={{ color: palet.metinIkincil }}>
                Saat (opsiyonel)
              </Text>
              <TextInput
                value={saat}
                onChangeText={setSaat}
                placeholder="20:30"
                placeholderTextColor={palet.metinIkincil}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                style={inputStyle}
              />

              {/* Kategori */}
              <Text className="mb-2 mt-4 font-semibold" style={{ color: palet.metinIkincil }}>
                Kategori
              </Text>
              <KategoriSecici secili={kategori} onChange={setKategori} />

              {/* Not */}
              <Text className="mb-2 mt-4 font-semibold" style={{ color: palet.metinIkincil }}>
                Not (opsiyonel)
              </Text>
              <TextInput
                value={not}
                onChangeText={setNot}
                placeholder="Küçük bir detay ekle..."
                placeholderTextColor={palet.metinIkincil}
                multiline
                numberOfLines={3}
                style={[inputStyle, { minHeight: 80, textAlignVertical: "top" }]}
              />

              {/* Hatırlatıcı */}
              <View
                className="mt-4 flex-row items-center justify-between rounded-2xl px-4 py-3"
                style={{ backgroundColor: palet.yuzeyIkincil }}
              >
                <View className="flex-row items-center">
                  <Ionicons name="notifications" size={18} color={palet.primary} />
                  <Text className="ml-2 font-semibold" style={{ color: palet.metin }}>
                    Hatırlatıcı ekle
                  </Text>
                </View>
                <Switch
                  value={hatirlatici}
                  onValueChange={setHatirlatici}
                  trackColor={{ false: palet.kenarlik, true: palet.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

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
                <Text className="text-lg font-bold text-white">
                  {duzenlenen ? "Güncelle" : "Kaydet"}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
