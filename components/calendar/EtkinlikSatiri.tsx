// ====================================================================
// EtkinlikSatiri
// ====================================================================
// Seçili güne ait tek bir etkinliği gösteren kart.
// Sol kenarda kategori rengi şeridi; sağda düzenle/sil/aktar butonları.
// "Apple Takvim'e Aktar" işlemi kart içinde yürütülür.
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";

import { kategoriBilgisi } from "@/constants/kategoriler";
import { RADIUS, SHADOWS } from "@/constants/theme";
import { appleTakvimeAktar } from "@/services/appleCalendar";
import type { CalendarEvent } from "@/store/calendarStore";
import { usePalet } from "@/store/useThemeStore";

interface EtkinlikSatiriProps {
  event: CalendarEvent;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
}

export function EtkinlikSatiri({ event, onEdit, onDelete }: EtkinlikSatiriProps) {
  const palet = usePalet();
  const kategori = kategoriBilgisi(event.category);
  const [aktariliyor, setAktariliyor] = useState(false);

  // Silme onayı
  const silOnayi = () => {
    Alert.alert("Etkinliği sil", `"${event.title}" silinsin mi?`, [
      { text: "Vazgeç", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: () => onDelete(event) },
    ]);
  };

  // Apple Takvim'e aktar
  const aktar = async () => {
    setAktariliyor(true);
    const sonuc = await appleTakvimeAktar(event);
    setAktariliyor(false);
    Alert.alert(sonuc.basarili ? "Başarılı 💕" : "Olmadı", sonuc.mesaj);
  };

  return (
    <View
      className="flex-row overflow-hidden"
      style={{
        backgroundColor: palet.yuzey,
        borderRadius: RADIUS.md,
        ...SHADOWS.yumusak,
      }}
    >
      {/* Sol kategori şeridi */}
      <View style={{ width: 6, backgroundColor: kategori.renk }} />

      <View className="flex-1 p-4">
        {/* Üst satır: kategori etiketi + saat */}
        <View className="mb-1 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons name={kategori.ikon} size={14} color={kategori.renk} />
            <Text className="ml-1 text-xs font-semibold" style={{ color: kategori.renk }}>
              {kategori.etiket}
            </Text>
          </View>
          {event.time ? (
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={14} color={palet.metinIkincil} />
              <Text className="ml-1 text-xs" style={{ color: palet.metinIkincil }}>
                {event.time}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Başlık */}
        <Text className="text-lg font-bold" style={{ color: palet.metin }}>
          {event.title}
        </Text>

        {/* Not */}
        {event.note ? (
          <Text className="mt-1" style={{ color: palet.metinIkincil }}>
            {event.note}
          </Text>
        ) : null}

        {/* Hatırlatıcı rozeti */}
        {event.hasReminder ? (
          <View className="mt-2 flex-row items-center">
            <Ionicons name="notifications" size={13} color={palet.secondary} />
            <Text className="ml-1 text-xs" style={{ color: palet.secondary }}>
              Hatırlatıcı açık
            </Text>
          </View>
        ) : null}

        {/* Aksiyon butonları */}
        <View className="mt-3 flex-row items-center gap-2">
          {/* Aktar */}
          <Pressable
            onPress={aktar}
            disabled={aktariliyor}
            className="flex-row items-center rounded-full px-3 py-2"
            style={{ backgroundColor: palet.yuzeyIkincil }}
          >
            {aktariliyor ? (
              <ActivityIndicator size="small" color={palet.primary} />
            ) : (
              <Ionicons name="share-outline" size={16} color={palet.primary} />
            )}
            <Text className="ml-1 text-xs font-semibold" style={{ color: palet.primary }}>
              Takvime Aktar
            </Text>
          </Pressable>

          {/* Düzenle */}
          <Pressable
            onPress={() => onEdit(event)}
            hitSlop={6}
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: palet.yuzeyIkincil }}
          >
            <Ionicons name="create-outline" size={18} color={palet.metin} />
          </Pressable>

          {/* Sil */}
          <Pressable
            onPress={silOnayi}
            hitSlop={6}
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: palet.yuzeyIkincil }}
          >
            <Ionicons name="trash-outline" size={18} color="#E14D80" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
