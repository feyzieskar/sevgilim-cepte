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

    // 2) Bundan sonraki tüm oturum değişikliklerini dinle
    //    (giriş, çıkış, token yenileme...) ve store'u güncelle
    supabase.auth.onAuthStateChange((_event, session) => {
      supabase.realtime.setAuth(session?.access_token ?? null);
      set({ session, user: session?.user ?? null });
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
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },
}));
