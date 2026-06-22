// ====================================================================
// TAKVİM STORE (Zustand + AsyncStorage persist)
// ====================================================================
// Etkinlikler yerel olarak telefonda saklanır (backend henüz yok).
// persist middleware sayesinde uygulama kapatılıp açılsa da veriler
// AsyncStorage'da kalıcı kalır.
// ====================================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { EventCategory } from "@/constants/kategoriler";

// --- Veri modeli (spec ile birebir) ---
export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO format: "YYYY-MM-DD"
  time?: string; // "HH:mm"
  category: EventCategory;
  note?: string;
  hasReminder: boolean;
  // Hatırlatıcı planlandıysa, iptal edebilmek için bildirim kimliği
  notificationId?: string;
}

interface CalendarState {
  events: CalendarEvent[];
  // Persist verisi diskten yüklendi mi? (ilk render'da boş ekran kaçınmak için)
  hidratlandiMi: boolean;
  setHidratlandi: (deger: boolean) => void;

  // Yeni etkinlik ekler ve oluşturulan kaydı döndürür
  addEvent: (girdi: Omit<CalendarEvent, "id">) => CalendarEvent;
  // Var olan etkinliği günceller (kısmi alanlarla)
  updateEvent: (id: string, degisiklikler: Partial<CalendarEvent>) => void;
  // Etkinliği siler
  deleteEvent: (id: string) => void;
  // Belirli bir güne ait etkinlikleri döndürür (saate göre sıralı)
  getEventsByDate: (dateISO: string) => CalendarEvent[];
}

// Basit benzersiz kimlik üretici (uuid paketine gerek kalmadan)
function yeniId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// Etkinlikleri saate göre sıralar (saatsizler en sona)
function saateGoreSirala(liste: CalendarEvent[]): CalendarEvent[] {
  return [...liste].sort((a, b) => {
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      events: [],
      hidratlandiMi: false,
      setHidratlandi: (deger) => set({ hidratlandiMi: deger }),

      addEvent: (girdi) => {
        const yeni: CalendarEvent = { ...girdi, id: yeniId() };
        set((s) => ({ events: [...s.events, yeni] }));
        return yeni;
      },

      updateEvent: (id, degisiklikler) => {
        set((s) => ({
          events: s.events.map((e) =>
            e.id === id ? { ...e, ...degisiklikler } : e
          ),
        }));
      },

      deleteEvent: (id) => {
        set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
      },

      getEventsByDate: (dateISO) => {
        return saateGoreSirala(get().events.filter((e) => e.date === dateISO));
      },
    }),
    {
      name: "sevgilim-cepte-takvim", // AsyncStorage anahtarı
      storage: createJSONStorage(() => AsyncStorage),
      // Yalnızca etkinlik listesini diske yaz (fonksiyonlar JSON'a yazılmaz)
      partialize: (s): { events: CalendarEvent[] } => ({ events: s.events }),
      // Disk yüklemesi bittiğinde hidratlandı bayrağını kaldır
      onRehydrateStorage: () => (state) => {
        state?.setHidratlandi(true);
      },
    }
  )
);
