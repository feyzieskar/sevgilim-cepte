// ====================================================================
// TAKVİM SEKMESİ
// ====================================================================
// - Aylık takvim (react-native-calendars), kategori renginde noktalar
// - Seçili günün etkinlik listesi (düzenle / sil / Apple Takvim'e aktar)
// - "Yeni etkinlik" ekleme (alttan açılan form modalı)
// - "Bize Özel Günler" sekmesi (geri sayımlı liste)
// Veriler Zustand + AsyncStorage'da kalıcıdır (backend yok).
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, LocaleConfig } from "react-native-calendars";

import {
  EtkinlikFormModal,
  EtkinlikFormVerisi,
} from "@/components/calendar/EtkinlikFormModal";
import { EtkinlikSatiri } from "@/components/calendar/EtkinlikSatiri";
import { OzelGunlerListesi } from "@/components/calendar/OzelGunlerListesi";
import { EkranBasligi } from "@/components/ui/EkranBasligi";
import { kategoriBilgisi } from "@/constants/kategoriler";
import { AYLAR, GUNLER, bugunISO, tarihUzun } from "@/constants/tarih";
import { RADIUS, SHADOWS } from "@/constants/theme";
import { hatirlaticiIptal, hatirlaticiPlanla } from "@/services/notifications";
import {
  CalendarEvent,
  useCalendarStore,
} from "@/store/calendarStore";
import { usePalet, useThemeStore } from "@/store/useThemeStore";

// --- Takvimi Türkçeleştir (modül yüklenince bir kez) ---
LocaleConfig.locales.tr = {
  monthNames: AYLAR,
  monthNamesShort: AYLAR.map((a) => a.slice(0, 3)),
  dayNames: GUNLER,
  dayNamesShort: ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"],
  today: "Bugün",
};
LocaleConfig.defaultLocale = "tr";

type Gorunum = "takvim" | "ozel";

export default function TakvimEkrani() {
  const palet = usePalet();
  const mod = useThemeStore((s) => s.mod);

  // Store
  const events = useCalendarStore((s) => s.events);
  const addEvent = useCalendarStore((s) => s.addEvent);
  const updateEvent = useCalendarStore((s) => s.updateEvent);
  const deleteEvent = useCalendarStore((s) => s.deleteEvent);

  // Yerel durum
  const [gorunum, setGorunum] = useState<Gorunum>("takvim");
  const [seciliGun, setSeciliGun] = useState<string>(bugunISO());
  const [modalAcik, setModalAcik] = useState(false);
  const [duzenlenen, setDuzenlenen] = useState<CalendarEvent | null>(null);

  // Takvim üzerinde işaretlenecek günler (kategori renginde noktalar)
  const markedDates = useMemo(() => {
    const sonuc: Record<string, any> = {};

    for (const e of events) {
      const renk = kategoriBilgisi(e.category).renk;
      if (!sonuc[e.date]) sonuc[e.date] = { dots: [] };
      // Aynı gün/aynı kategori için tek nokta yeter
      const varMi = sonuc[e.date].dots.some(
        (d: { key: string }) => d.key === e.category
      );
      if (!varMi) {
        sonuc[e.date].dots.push({ key: e.category, color: renk });
      }
    }

    // Seçili günü vurgula
    sonuc[seciliGun] = {
      ...(sonuc[seciliGun] || { dots: [] }),
      selected: true,
      selectedColor: palet.primary,
    };

    return sonuc;
  }, [events, seciliGun, palet.primary]);

  // Seçili günün etkinlikleri (saate göre sıralı)
  const gununEtkinlikleri = useMemo(() => {
    return events
      .filter((e) => e.date === seciliGun)
      .sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });
  }, [events, seciliGun]);

  // "Yeni etkinlik" aç
  const yeniEkle = () => {
    setDuzenlenen(null);
    setModalAcik(true);
  };

  // Düzenle aç
  const duzenle = (event: CalendarEvent) => {
    setDuzenlenen(event);
    setModalAcik(true);
  };

  // Formdan kaydet (ekle veya güncelle) + hatırlatıcı yönetimi
  const kaydet = async (veri: EtkinlikFormVerisi) => {
    if (duzenlenen) {
      // Var olan hatırlatıcıyı iptal et, gerekiyorsa yenisini planla
      await hatirlaticiIptal(duzenlenen.notificationId);
      let notificationId: string | undefined;
      if (veri.hasReminder) {
        const tam: CalendarEvent = { ...duzenlenen, ...veri };
        notificationId = (await hatirlaticiPlanla(tam)) ?? undefined;
        if (!notificationId) hatirlaticiUyarisi();
      }
      updateEvent(duzenlenen.id, { ...veri, notificationId });
    } else {
      const yeni = addEvent({ ...veri });
      if (veri.hasReminder) {
        const notificationId = (await hatirlaticiPlanla(yeni)) ?? undefined;
        if (notificationId) {
          updateEvent(yeni.id, { notificationId });
        } else {
          hatirlaticiUyarisi();
        }
      }
    }
    setModalAcik(false);
    setDuzenlenen(null);
  };

  // Hatırlatıcı planlanamadığında nazik uyarı (geçmiş tarih / izin yok)
  const hatirlaticiUyarisi = () => {
    Alert.alert(
      "Hatırlatıcı kurulamadı",
      "Bildirim izni kapalı olabilir ya da seçtiğin zaman geçmişte. Etkinlik yine de kaydedildi."
    );
  };

  // Sil + hatırlatıcıyı iptal et
  const sil = async (event: CalendarEvent) => {
    await hatirlaticiIptal(event.notificationId);
    deleteEvent(event.id);
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: palet.arkaplan }}
    >
      <View className="px-5 pt-2">
        <EkranBasligi baslik="Takvim" altBaslik="Ortak planlarımız 💕" />

        {/* Görünüm seçici: Takvim | Özel Günler */}
        <View
          className="mt-2 flex-row rounded-full p-1"
          style={{ backgroundColor: palet.yuzeyIkincil }}
        >
          {(
            [
              { id: "takvim", etiket: "Takvim", ikon: "calendar" },
              { id: "ozel", etiket: "Özel Günler", ikon: "star" },
            ] as const
          ).map((s) => {
            const aktif = gorunum === s.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => setGorunum(s.id)}
                className="flex-1 flex-row items-center justify-center rounded-full py-2"
                style={{ backgroundColor: aktif ? palet.primary : "transparent" }}
              >
                <Ionicons
                  name={s.ikon}
                  size={16}
                  color={aktif ? "#FFFFFF" : palet.metinIkincil}
                />
                <Text
                  className="ml-1.5 font-semibold"
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
      >
        {gorunum === "takvim" ? (
          <>
            {/* Aylık takvim kartı */}
            <View
              style={{
                backgroundColor: palet.yuzey,
                borderRadius: RADIUS.lg,
                padding: 8,
                ...SHADOWS.kart,
              }}
            >
              <Calendar
                // Tema değişince takvim temasının yenilenmesi için key
                key={mod}
                current={seciliGun}
                onDayPress={(g) => setSeciliGun(g.dateString)}
                markingType="multi-dot"
                markedDates={markedDates}
                firstDay={1} // hafta Pazartesi başlasın
                enableSwipeMonths
                theme={{
                  calendarBackground: palet.yuzey,
                  monthTextColor: palet.metin,
                  textMonthFontWeight: "bold",
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

            {/* Seçili günün başlığı */}
            <Text
              className="mb-3 mt-6 text-lg font-bold"
              style={{ color: palet.metin }}
            >
              {tarihUzun(seciliGun)}
            </Text>

            {/* Etkinlik listesi */}
            {gununEtkinlikleri.length > 0 ? (
              <View className="gap-3">
                {gununEtkinlikleri.map((e) => (
                  <EtkinlikSatiri
                    key={e.id}
                    event={e}
                    onEdit={duzenle}
                    onDelete={sil}
                  />
                ))}
              </View>
            ) : (
              <View
                className="items-center rounded-2xl py-10"
                style={{ backgroundColor: palet.yuzey, ...SHADOWS.yumusak }}
              >
                <Ionicons name="heart-outline" size={36} color={palet.metinIkincil} />
                <Text className="mt-2" style={{ color: palet.metinIkincil }}>
                  Bu güne ait plan yok. Hadi bir tane ekleyelim 💕
                </Text>
              </View>
            )}
          </>
        ) : (
          <OzelGunlerListesi events={events} />
        )}
      </ScrollView>

      {/* Yeni etkinlik ekleme butonu (FAB) — sadece takvim görünümünde */}
      {gorunum === "takvim" ? (
        <Pressable
          onPress={yeniEkle}
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
      ) : null}

      {/* Form modalı */}
      <EtkinlikFormModal
        visible={modalAcik}
        onClose={() => {
          setModalAcik(false);
          setDuzenlenen(null);
        }}
        tarih={seciliGun}
        duzenlenen={duzenlenen}
        onKaydet={kaydet}
      />
    </SafeAreaView>
  );
}
