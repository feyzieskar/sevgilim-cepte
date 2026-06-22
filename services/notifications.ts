// ====================================================================
// BİLDİRİM SERVİSİ (expo-notifications)
// ====================================================================
// Etkinlik hatırlatıcılarını planlar / iptal eder.
// Hatırlatıcı, etkinliğin tarih+saatinde tetiklenir (saat yoksa 09:00).
// ====================================================================

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { CalendarEvent } from "@/store/calendarStore";

// Uygulama ön plandayken de bildirimin görünmesini sağlar.
// (Modül import edilince bir kez çalışır.)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Android için bildirim kanalı (iOS'ta gerekmez ama zararsız).
async function kanaliHazirla() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("hatirlaticilar", {
      name: "Hatırlatıcılar",
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: "#FF6B9D",
    });
  }
}

// Bildirim izni ister; izin verildiyse true döner.
export async function bildirimIzniIste(): Promise<boolean> {
  const mevcut = await Notifications.getPermissionsAsync();
  let durum = mevcut.status;
  if (durum !== "granted") {
    const istek = await Notifications.requestPermissionsAsync();
    durum = istek.status;
  }
  return durum === "granted";
}

// Etkinliğin tetiklenme zamanını (Date) hesaplar.
function tetikZamani(event: CalendarEvent): Date {
  const [yil, ay, gun] = event.date.split("-").map(Number);
  let saat = 9;
  let dakika = 0;
  if (event.time) {
    const [s, d] = event.time.split(":").map(Number);
    saat = s ?? 9;
    dakika = d ?? 0;
  }
  return new Date(yil, ay - 1, gun, saat, dakika, 0);
}

// Bir etkinlik için hatırlatıcı planlar.
// Başarılıysa bildirim kimliğini, aksi halde null döner.
export async function hatirlaticiPlanla(
  event: CalendarEvent
): Promise<string | null> {
  const izin = await bildirimIzniIste();
  if (!izin) return null;

  await kanaliHazirla();

  const zaman = tetikZamani(event);
  // Geçmiş bir zaman için bildirim planlanamaz
  if (zaman.getTime() <= Date.now()) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Sevgilim Cepte 💕",
      body: event.time
        ? `${event.title} — saat ${event.time}`
        : event.title,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: zaman,
      channelId: "hatirlaticilar",
    },
  });

  return id;
}

// Anında (şimdi) bir bildirim gösterir. Realtime ile gelen yeni sürpriz
// gibi durumlarda kullanılır. İzin yoksa sessizce geçer.
export async function bildirimGonderHemen(
  title: string,
  body: string
): Promise<void> {
  const izin = await bildirimIzniIste();
  if (!izin) return;
  await kanaliHazirla();
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null, // hemen tetikle
  });
}

// Planlanmış bir hatırlatıcıyı iptal eder.
export async function hatirlaticiIptal(notificationId?: string) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Zaten tetiklenmiş/silinmiş olabilir; sessizce geç
  }
}
