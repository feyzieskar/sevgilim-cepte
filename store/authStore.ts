// ====================================================================
// AUTH STORE (Zustand + Supabase Auth)
// ====================================================================
// Kimlik doğrulama durumunu global olarak yönetir:
//  - session / user: mevcut oturum bilgisi
//  - initialized: açılışta session kontrolü bitti mi? (route guard için)
//  - signIn / signUp / signOut: e-posta + şifre işlemleri
//  - initialize: uygulama açılışında çağrılır; kayıtlı session'ı yükler
//    ve onAuthStateChange ile değişiklikleri dinler (otomatik giriş).
//
// Oturumun kendisi Supabase tarafından AsyncStorage'da saklanır
// (bkz. lib/supabase.ts). Bu store sadece React tarafındaki yansımadır.
// ====================================================================

import { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";

import { supabase } from "@/lib/supabase";
import { kaydetPushToken, temizlePushToken } from "@/services/pushService";

// signIn/signUp sonucu: hata varsa kullanıcıya gösterilecek mesaj döner.
export interface AuthSonuc {
  basarili: boolean;
  hata?: string;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  // Açılışta ilk session kontrolü tamamlandı mı?
  initialized: boolean;
  // signIn/signUp sırasında yükleniyor mu?
  loading: boolean;

  // Açılışta bir kez çağrılır: kayıtlı session'ı yükler + dinleyici kurar
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<AuthSonuc>;
  signUp: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<AuthSonuc>;
  signOut: () => Promise<void>;
  changePassword: (yeniSifre: string) => Promise<AuthSonuc>;
  updateDisplayName: (displayName: string) => Promise<AuthSonuc>;
}

// Supabase hata mesajlarını kullanıcı dostu Türkçe metne çevirir.
function hataCevir(mesaj: string): string {
  const m = mesaj.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "E-posta veya şifre hatalı.";
  if (m.includes("email not confirmed"))
    return "E-posta henüz onaylanmamış. Gelen kutunu kontrol et.";
  if (m.includes("user already registered"))
    return "Bu e-posta zaten kayıtlı. Giriş yapmayı dene.";
  if (m.includes("password should be at least"))
    return "Şifre en az 6 karakter olmalı.";
  if (m.includes("same as the old password"))
    return "Yeni şifre eskisiyle aynı olamaz.";
  if (m.includes("weak password") || m.includes("password is too weak"))
    return "Şifre çok zayıf. Daha güçlü bir şifre seç.";
  if (m.includes("unable to validate email") || m.includes("invalid email"))
    return "Geçerli bir e-posta gir.";
  if (m.includes("network"))
    return "İnternet bağlantını kontrol et.";
  return mesaj;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  initialized: false,
  loading: false,

  initialize: async () => {
    // 1) Kayıtlı (AsyncStorage'daki) session'ı yükle
    const { data } = await supabase.auth.getSession();
    // Realtime'ın RLS'i doğru uygulaması için access token'ı ilet
    // (postgres_changes'in partner satırlarını gönderebilmesi için gerekli)
    supabase.realtime.setAuth(data.session?.access_token ?? null);
    set({
      session: data.session,
      user: data.session?.user ?? null,
      initialized: true,
    });

    // Açılışta zaten oturum varsa push token'ı yenile / kaydet
    if (data.session?.user) {
      void kaydetPushToken();
    }

    // 2) Bundan sonraki tüm oturum değişikliklerini dinle
    //    (giriş, çıkış, token yenileme...) ve store'u güncelle
    supabase.auth.onAuthStateChange((event, session) => {
      supabase.realtime.setAuth(session?.access_token ?? null);
      set({ session, user: session?.user ?? null });

      // Yeni girişte push token kaydet
      if (session?.user && event === "SIGNED_IN") {
        void kaydetPushToken();
      }
    });
  },

  signIn: async (email, password) => {
    set({ loading: true });
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    set({ loading: false });
    if (error) return { basarili: false, hata: hataCevir(error.message) };
    return { basarili: true };
  },

  signUp: async (email, password, displayName) => {
    set({ loading: true });
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        // profiles tablosundaki tetikleyici bu adı kullanır
        data: { display_name: displayName?.trim() || null },
      },
    });
    set({ loading: false });
    if (error) return { basarili: false, hata: hataCevir(error.message) };
    return { basarili: true };
  },

  signOut: async () => {
    // Çıkıştan önce token'ı temizle (cihaz eşleşmesini kopar)
    await temizlePushToken();
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },

  changePassword: async (yeniSifre) => {
    if (yeniSifre.length < 6) {
      return { basarili: false, hata: "Şifre en az 6 karakter olmalı." };
    }

    set({ loading: true });
    const { error } = await supabase.auth.updateUser({ password: yeniSifre });
    set({ loading: false });

    if (error) return { basarili: false, hata: hataCevir(error.message) };
    return { basarili: true };
  },

  updateDisplayName: async (displayName) => {
    const temiz = displayName.trim();
    if (temiz === "") {
      return { basarili: false, hata: "Görünen ad boş olamaz." };
    }

    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      return { basarili: false, hata: "Oturum bulunamadı." };
    }

    set({ loading: true });

    const { error: profilHata } = await supabase
      .from("profiles")
      .update({ display_name: temiz })
      .eq("id", userId);

    const { data, error: authHata } = await supabase.auth.updateUser({
      data: { display_name: temiz },
    });

    set({ loading: false });

    if (profilHata || authHata) {
      return {
        basarili: false,
        hata: hataCevir(profilHata?.message ?? authHata?.message ?? "Kaydedilemedi"),
      };
    }

    if (data.user) {
      set({ user: data.user });
    }

    return { basarili: true };
  },
}));

// Oturumdaki kullanıcının görünen adını döndürür.
// Sırasıyla: kayıt sırasında girilen ad -> e-postanın @ öncesi -> "Sevgilim".
export function useGoruntulenenAd(): string {
  return useAuthStore((s) => {
    const u = s.user;
    if (!u) return "";
    const ad = (u.user_metadata?.display_name as string | undefined)?.trim();
    if (ad) return ad;
    const eposta = u.email?.split("@")[0];
    return eposta && eposta.length > 0 ? eposta : "Sevgilim";
  });
}
