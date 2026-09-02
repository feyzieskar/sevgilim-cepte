// ====================================================================
// TAKVİM STORE (Zustand + Supabase)
// ====================================================================
// Etkinlikler artık bulutta (Supabase "events" tablosu) saklanır; böylece
// ben ve sevgilim aynı takvimi senkron görürüz. Açılışta fetchEvents ile
// çekilir; ekle/güncelle/sil işlemleri doğrudan Supabase'e yazılır ve
// yerel state iyimser (optimistic) olarak güncellenir.
//
// notificationId istisnası: hatırlatıcı her telefonda AYRI planlandığı
// için cihaza özeldir ve DB'de tutulmaz. Bunun yerine eventId -> bildirim
// eşlemesi yerel AsyncStorage'da saklanır ve fetch sırasında birleştirilir.
// ====================================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import { RealtimeChannel } from "@supabase/supabase-js";
import { create } from "zustand";

import { EventCategory } from "@/constants/kategoriler";
import { supabase } from "@/lib/supabase";

// --- Veri modeli (uygulama tarafı, camelCase) ---
export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO format: "YYYY-MM-DD"
  time?: string; // "HH:mm"
  category: EventCategory;
  note?: string;
  hasReminder: boolean;
  // Hatırlatıcı planlandıysa cihaz-yerel bildirim kimliği (DB'de yok)
  notificationId?: string;
}

// --- Supabase "events" satırı (snake_case) ---
interface EventRow {
  id: string;
  title: string;
  date: string;
  time: string | null;
  category: EventCategory;
  note: string | null;
  has_reminder: boolean;
  created_by: string;
  created_at: string;
}

interface CalendarState {
  events: CalendarEvent[];
  // İlk yükleme (fetch) tamamlandı mı? (boş ekran/yükleniyor ayrımı için)
  yuklendiMi: boolean;
  // Şu an Supabase'den çekiliyor mu?
  loading: boolean;

  // Supabase'den tüm etkinlikleri çeker (RLS sayesinde ben + partner)
  fetchEvents: () => Promise<void>;
  // Yeni etkinlik ekler ve oluşturulan kaydı döndürür (hata olursa null)
  addEvent: (girdi: Omit<CalendarEvent, "id" | "notificationId">) => Promise<CalendarEvent | null>;
  // Var olan etkinliği günceller (kısmi alanlarla)
  updateEvent: (id: string, degisiklikler: Partial<CalendarEvent>) => Promise<void>;
  // Etkinliği siler
  deleteEvent: (id: string) => Promise<void>;
  // Cihaz-yerel hatırlatıcı kimliğini ayarlar/temizler
  setNotificationId: (id: string, notificationId?: string) => Promise<void>;
  // Belirli bir güne ait etkinlikleri döndürür (saate göre sıralı)
  getEventsByDate: (dateISO: string) => CalendarEvent[];
  // Realtime aboneliği kurar; temizleme fonksiyonu döndürür
  subscribeRealtime: () => () => void;
}

// ---- Cihaz-yerel hatırlatıcı eşlemesi (eventId -> notificationId) ----
const BILDIRIM_HARITASI_ANAHTARI = "sevgilim-cepte-bildirim-haritasi";

async function bildirimHaritasiOku(): Promise<Record<string, string>> {
  try {
    const ham = await AsyncStorage.getItem(BILDIRIM_HARITASI_ANAHTARI);
    return ham ? (JSON.parse(ham) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

async function bildirimHaritasiYaz(harita: Record<string, string>) {
  try {
    await AsyncStorage.setItem(BILDIRIM_HARITASI_ANAHTARI, JSON.stringify(harita));
  } catch {
    // Yerel yazım hatası kritik değil; sessizce geç
  }
}

// DB satırını uygulama modeline çevirir (yerel bildirim kimliğini ekler)
function satiriEventeCevir(r: EventRow, harita: Record<string, string>): CalendarEvent {
  return {
    id: r.id,
    title: r.title,
    date: r.date,
    time: r.time ?? undefined,
    category: r.category,
    note: r.note ?? undefined,
    hasReminder: r.has_reminder,
    notificationId: harita[r.id],
  };
}

// Uygulama modelindeki değişiklikleri DB sütunlarına (snake_case) çevirir.
// notificationId DB'ye yazılmaz (cihaz-yerel).
function degisiklikleriRowaCevir(d: Partial<CalendarEvent>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (d.title !== undefined) row.title = d.title;
  if (d.date !== undefined) row.date = d.date;
  if (d.time !== undefined) row.time = d.time ?? null;
  if (d.category !== undefined) row.category = d.category;
  if (d.note !== undefined) row.note = d.note ?? null;
  if (d.hasReminder !== undefined) row.has_reminder = d.hasReminder;
  return row;
}

// Tek bir Realtime kanalı (çift abonelik kurmamak için modül seviyesinde)
let etkinlikKanali: RealtimeChannel | null = null;

// Etkinlikleri saate göre sıralar (saatsizler en sona)
function saateGoreSirala(liste: CalendarEvent[]): CalendarEvent[] {
  return [...liste].sort((a, b) => {
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  yuklendiMi: false,
  loading: false,

  fetchEvents: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      console.warn("[calendarStore] fetchEvents hatası:", error.message);
      set({ loading: false, yuklendiMi: true });
      return;
    }

    const harita = await bildirimHaritasiOku();
    const events = (data as EventRow[]).map((r) => satiriEventeCevir(r, harita));
    set({ events, loading: false, yuklendiMi: true });
  },

  addEvent: async (girdi) => {
    const { data, error } = await supabase
      .from("events")
      .insert({
        title: girdi.title,
        date: girdi.date,
        time: girdi.time ?? null,
        category: girdi.category,
        note: girdi.note ?? null,
        has_reminder: girdi.hasReminder,
        // created_by, DB tarafında auth.uid() ile otomatik dolar
      })
      .select()
      .single();

    if (error || !data) {
      console.warn("[calendarStore] addEvent hatası:", error?.message);
      return null;
    }

    const harita = await bildirimHaritasiOku();
    const yeni = satiriEventeCevir(data as EventRow, harita);
    set((s) => ({ events: [...s.events, yeni] }));
    return yeni;
  },

  updateEvent: async (id, degisiklikler) => {
    // notificationId yerelde yönetilir (DB'ye gitmez)
    if ("notificationId" in degisiklikler) {
      await get().setNotificationId(id, degisiklikler.notificationId);
    }

    const row = degisiklikleriRowaCevir(degisiklikler);
    if (Object.keys(row).length > 0) {
      const { error } = await supabase.from("events").update(row).eq("id", id);
      if (error) {
        console.warn("[calendarStore] updateEvent hatası:", error.message);
      }
    }

    // Yerel state'i iyimser güncelle
    set((s) => ({
      events: s.events.map((e) => (e.id === id ? { ...e, ...degisiklikler } : e)),
    }));
  },

  deleteEvent: async (id) => {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) {
      console.warn("[calendarStore] deleteEvent hatası:", error.message);
    }

    // Yerel bildirim eşlemesinden de kaldır
    const harita = await bildirimHaritasiOku();
    if (harita[id]) {
      delete harita[id];
      await bildirimHaritasiYaz(harita);
    }

    set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
  },

  setNotificationId: async (id, notificationId) => {
    const harita = await bildirimHaritasiOku();
    if (notificationId) harita[id] = notificationId;
    else delete harita[id];
    await bildirimHaritasiYaz(harita);

    set((s) => ({
      events: s.events.map((e) => (e.id === id ? { ...e, notificationId } : e)),
    }));
  },

  getEventsByDate: (dateISO) => {
    return saateGoreSirala(get().events.filter((e) => e.date === dateISO));
  },

  subscribeRealtime: () => {
    if (etkinlikKanali) return () => {};

    etkinlikKanali = supabase
      .channel("events-degisiklikleri")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => {
        // Her değişiklikte listeyi tazele (basit ve güvenli)
        get().fetchEvents();
      })
      .subscribe();

    return () => {
      if (etkinlikKanali) {
        supabase.removeChannel(etkinlikKanali);
        etkinlikKanali = null;
      }
    };
  },
}));
