// ====================================================================
// BucketFormModal — yeni hayal ekleme
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

import {
  BUCKET_KATEGORILERI,
  BucketKategori,
} from "@/data/bucketList";
import { AYLAR, GUNLER, bugunISO, tarihUzun } from "@/constants/tarih";
import { RADIUS } from "@/constants/theme";
import { BucketGirdi } from "@/store/bucketListStore";
import { usePalet, useThemeStore } from "@/store/useThemeStore";

LocaleConfig.locales.tr = {
  monthNames: AYLAR,
  monthNamesShort: AYLAR.map((a) => a.slice(0, 3)),
  dayNames: GUNLER,
  dayNamesShort: ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"],
  today: "Bugün",
};
LocaleConfig.defaultLocale = "tr";

interface BucketFormModalProps {
  visible: boolean;
  onClose: () => void;
  onKaydet: (veri: BucketGirdi) => void | Promise<void>;
}

export function BucketFormModal({
  visible,
  onClose,
  onKaydet,
}: BucketFormModalProps) {
  const palet = usePalet();
  const mod = useThemeStore((s) => s.mod);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<BucketKategori>("hayal");
  const [emoji, setEmoji] = useState("✨");
  const [targetDate, setTargetDate] = useState<string | undefined>();
  const [takvimAcik, setTakvimAcik] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTitle("");
    setDescription("");
    setCategory("hayal");
    setEmoji("✨");
    setTargetDate(undefined);
    setTakvimAcik(false);
  }, [visible]);

  const kaydet = async () => {
    if (title.trim() === "") return;
    setKaydediliyor(true);
    await onKaydet({
      title,
      description,
      category,
      emoji,
      targetDate,
    });
    setKaydediliyor(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "#00000066" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={{
            maxHeight: "90%",
            backgroundColor: palet.yuzey,
            borderTopLeftRadius: RADIUS.lg,
            borderTopRightRadius: RADIUS.lg,
            padding: 20,
          }}
        >
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold" style={{ color: palet.metin }}>
              Yeni Hayal ✨
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={palet.metinIkincil} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="mb-2 font-semibold" style={{ color: palet.metin }}>
              Başlık
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Örn: Kapadokya'ya gitmek"
              placeholderTextColor={palet.metinIkincil}
              style={{
                backgroundColor: palet.yuzeyIkincil,
                borderRadius: RADIUS.md,
                color: palet.metin,
                padding: 14,
                marginBottom: 16,
              }}
            />

            <Text className="mb-2 font-semibold" style={{ color: palet.metin }}>
              Açıklama (opsiyonel)
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Detay ekle..."
              placeholderTextColor={palet.metinIkincil}
              multiline
              style={{
                backgroundColor: palet.yuzeyIkincil,
                borderRadius: RADIUS.md,
                color: palet.metin,
                padding: 14,
                minHeight: 72,
                marginBottom: 16,
                textAlignVertical: "top",
              }}
            />

            <Text className="mb-2 font-semibold" style={{ color: palet.metin }}>
              Kategori
            </Text>
            <View className="mb-4 flex-row flex-wrap" style={{ gap: 8 }}>
              {BUCKET_KATEGORILERI.map((k) => {
                const aktif = category === k.id;
                return (
                  <Pressable
                    key={k.id}
                    onPress={() => {
                      setCategory(k.id);
                      setEmoji(k.emoji);
                    }}
                    className="flex-row items-center rounded-full px-3 py-2"
                    style={{
                      backgroundColor: aktif ? `${k.renk}33` : palet.yuzeyIkincil,
                      borderWidth: aktif ? 1.5 : 0,
                      borderColor: k.renk,
                    }}
                  >
                    <Text>{k.emoji}</Text>
                    <Text
                      className="ml-1 text-sm font-semibold"
                      style={{ color: palet.metin }}
                    >
                      {k.etiket}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() => setTakvimAcik((x) => !x)}
              className="mb-2 flex-row items-center justify-between rounded-xl px-4 py-3"
              style={{ backgroundColor: palet.yuzeyIkincil }}
            >
              <Text style={{ color: palet.metin }}>
                {targetDate ? tarihUzun(targetDate) : "Hedef tarih (opsiyonel)"}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={palet.primary} />
            </Pressable>

            {takvimAcik ? (
              <Calendar
                key={mod}
                current={targetDate ?? bugunISO()}
                onDayPress={(g) => {
                  setTargetDate(g.dateString);
                  setTakvimAcik(false);
                }}
                markedDates={
                  targetDate
                    ? { [targetDate]: { selected: true, selectedColor: palet.primary } }
                    : {}
                }
                theme={{
                  calendarBackground: palet.yuzeyIkincil,
                  dayTextColor: palet.metin,
                  monthTextColor: palet.metin,
                  arrowColor: palet.primary,
                }}
                style={{ borderRadius: RADIUS.md, marginBottom: 16 }}
              />
            ) : null}

            <Pressable
              onPress={kaydet}
              disabled={kaydediliyor || title.trim() === ""}
              className="mb-6 mt-2 items-center rounded-xl py-4"
              style={{
                backgroundColor:
                  title.trim() === "" ? palet.kenarlik : palet.primary,
              }}
            >
              {kaydediliyor ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="font-bold text-white">Hayali Ekle ✨</Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
