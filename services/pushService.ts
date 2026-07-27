// ====================================================================
// UZAKTAN PUSH BİLDİRİM SERVİSİ (Expo Push + Supabase)
// ====================================================================
// 1) Giriş sonrası Expo Push Token alır ve profiles.expo_push_token'a yazar.
// 2) sendPushToPartner ile partner'ın cihazına Edge Function üzerinden
//    uzaktan bildirim gönderir (uygulama kapalıyken bile).
//
// NOT: Simülatörde token alınamaz; fiziksel cihaz gerekir.
//      Üretimde (TestFlight) EAS build + projectId gerekir.
// ====================================================================

import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

// Android push kanalı (yerel hatırlatıcılardan ayrı).
const PUSH_KANALI = "uzaktan-bildirimler";

export type PushData = {
  /** Tıklanınca gidilecek sekme/ekran adı (ör. "surprizler", "takvim") */
  screen?: string;
  [key: string]: unknown;
};

// Android için varsayılan push kanalını hazırlar.
async function pushKanaliHazirla() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(PUSH_KANALI, {
      name: "Uzaktan Bildirimler",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF6B9D",
    });
  }
}

// Bildirim izni ister; verilmediyse false döner.
async function pushIzniIste(): Promise<boolean> {
  const mevcut = await Notifications.getPermissionsAsync();
  let durum = mevcut.status;
  if (durum !== "granted") {
    const istek = await Notifications.requestPermissionsAsync();
    durum = istek.status;
  }
  return durum === "granted";
}

// EAS projectId: app config / Constants üzerinden okunur.
function projectIdAl(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    undefined
  );
}

/**
 * Giriş yapmış kullanıcı için Expo Push Token alır ve
 * profiles.expo_push_token kolonuna kaydeder.
 * Simülatörde / izin yoksa sessizce çıkar.
 */
export async function kaydetPushToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.warn(
        "[pushService] Simülatörde Expo Push Token alınamaz; fiziksel cihaz kullan."
      );
      return null;
    }

    await pushKanaliHazirla();

    const izin = await pushIzniIste();
    if (!izin) {
      console.warn("[pushService] Bildirim izni verilmedi.");
      return null;
    }

    const projectId = projectIdAl();
    const tokenSonuc = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    const token = tokenSonuc.data;
    if (!token) return null;

    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      console.warn("[pushService] Oturum yok; token kaydedilemedi.");
      return null;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ expo_push_token: token })
      .eq("id", userId);

    if (error) {
      console.warn("[pushService] Token kaydetme hatası:", error.message);
      return null;
    }

    return token;
  } catch (e) {
    console.warn("[pushService] kaydetPushToken hatası:", e);
    return null;
  }
}

/** Çıkışta token'ı temizler (cihaz eşleşmesini koparır). */
export async function temizlePushToken(): Promise<void> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return;
  try {
    await supabase
      .from("profiles")
      .update({ expo_push_token: null })
      .eq("id", userId);
  } catch (e) {
    console.warn("[pushService] temizlePushToken hatası:", e);
  }
}

/**
 * Mevcut kullanıcının partner_id'sini bulur.
 * Çift yönlü eşleşme: kendi partner_id veya beni partner seçen.
 */
async function partnerIdBul(): Promise<string | null> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return null;

  const { data: profil, error } = await supabase
    .from("profiles")
    .select("partner_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("[pushService] partner profil okuma hatası:", error.message);
    return null;
  }

  if (profil?.partner_id) return profil.partner_id as string;

  // Beni partner olarak işaretleyen kullanıcı
  const { data: ters, error: tersHata } = await supabase
    .from("profiles")
    .select("id")
    .eq("partner_id", userId)
    .maybeSingle();

  if (tersHata) {
    console.warn("[pushService] ters partner arama hatası:", tersHata.message);
    return null;
  }

  return (ters?.id as string | undefined) ?? null;
}

/**
 * Partner'ın telefonuna uzaktan push gönderir.
 * Edge Function: send-push → Expo Push API.
 */
export async function sendPushToPartner(
  title: string,
  body: string,
  data?: PushData
): Promise<boolean> {
  try {
    const toUserId = await partnerIdBul();
    if (!toUserId) {
      console.warn("[pushService] Partner bulunamadı; push gönderilmedi.");
      return false;
    }

    const { data: sonuc, error } = await supabase.functions.invoke("send-push", {
      body: { toUserId, title, body, data: data ?? {} },
    });

    if (error) {
      console.warn("[pushService] send-push hatası:", error.message);
      return false;
    }

    // Expo API veya fonksiyon hata döndüyse logla
    if (sonuc?.error) {
      console.warn("[pushService] send-push yanıt hatası:", sonuc.error);
      return false;
    }

    return true;
  } catch (e) {
    console.warn("[pushService] sendPushToPartner hatası:", e);
    return false;
  }
}
