// ====================================================================
// APPLE TAKVİM SERVİSİ (expo-calendar)
// ====================================================================
// Bir etkinliği cihazın takvimine (iOS = Apple Takvim) ekler.
// İzin ister, yazılabilir bir varsayılan takvim bulur ve etkinliği
// oluşturur.
// ====================================================================

import * as Calendar from "expo-calendar";
import { Platform } from "react-native";

import type { CalendarEvent } from "@/store/calendarStore";

// Sonuç tipi: ekranda kullanıcıya geri bildirim göstermek için
export interface AktarmaSonucu {
  basarili: boolean;
  mesaj: string;
}

// Etkinliğin başlangıç/bitiş Date'lerini hesaplar.
// Saat varsa o saatten 1 saatlik etkinlik; yoksa tüm gün etkinliği.
function zamanAraligi(event: CalendarEvent): {
  baslangic: Date;
  bitis: Date;
  tumGun: boolean;
} {
  const [yil, ay, gun] = event.date.split("-").map(Number);

  if (event.time) {
    const [s, d] = event.time.split(":").map(Number);
    const baslangic = new Date(yil, ay - 1, gun, s ?? 0, d ?? 0, 0);
    const bitis = new Date(baslangic.getTime() + 60 * 60 * 1000); // +1 saat
    return { baslangic, bitis, tumGun: false };
  }

  const baslangic = new Date(yil, ay - 1, gun, 0, 0, 0);
  const bitis = new Date(yil, ay - 1, gun, 23, 59, 0);
  return { baslangic, bitis, tumGun: true };
}

// Yazılabilir bir takvim kimliği bulur (yoksa yeni bir tane oluşturur).
async function yazilabilirTakvimId(): Promise<string> {
  const takvimler = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

  // iOS'ta varsayılan takvimi tercih et
  if (Platform.OS === "ios") {
    try {
      const varsayilan = await Calendar.getDefaultCalendarAsync();
      if (varsayilan?.id) return varsayilan.id;
    } catch {
      // varsayılan alınamazsa aşağıdaki yedeğe düş
    }
  }

  const yazilabilir = takvimler.find((t) => t.allowsModifications);
  if (yazilabilir) return yazilabilir.id;

  // Hiç uygun takvim yoksa yeni bir tane oluştur
  const kaynakId =
    Platform.OS === "ios" ? (await Calendar.getDefaultCalendarAsync()).source.id : undefined;

  return Calendar.createCalendarAsync({
    title: "Sevgilim Cepte",
    color: "#FF6B9D",
    entityType: Calendar.EntityTypes.EVENT,
    sourceId: kaynakId,
    name: "sevgilim-cepte",
    ownerAccount: "personal",
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
}

// Etkinliği cihaz takvimine aktarır.
export async function appleTakvimeAktar(event: CalendarEvent): Promise<AktarmaSonucu> {
  try {
    const izin = await Calendar.requestCalendarPermissionsAsync();
    if (izin.status !== "granted") {
      return {
        basarili: false,
        mesaj: "Takvim izni verilmedi. Ayarlardan izin verebilirsin.",
      };
    }

    const takvimId = await yazilabilirTakvimId();
    const { baslangic, bitis, tumGun } = zamanAraligi(event);

    await Calendar.createEventAsync(takvimId, {
      title: event.title,
      startDate: baslangic,
      endDate: bitis,
      allDay: tumGun,
      notes: event.note,
      timeZone: undefined,
    });

    return { basarili: true, mesaj: "Etkinlik Apple Takvim'e eklendi 💕" };
  } catch (e) {
    return {
      basarili: false,
      mesaj: "Aktarma sırasında bir hata oluştu. Lütfen tekrar dene.",
    };
  }
}
