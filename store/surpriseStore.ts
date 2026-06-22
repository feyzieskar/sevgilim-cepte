// ====================================================================
// SÜRPRİZ STORE (Zustand + AsyncStorage persist)
// ====================================================================
// Sürpriz kutuları yerel olarak telefonda saklanır (backend henüz yok).
// Faz 2'de Supabase'e taşınacak: admin (ben) ekleyince sevgilinin
// telefonunda görünecek.
// ====================================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { TATIL_ESIK_GUN, UnlockType } from "@/constants/surpriz";
import { bugunISO, isoToDate } from "@/constants/tarih";
import { useCalendarStore } from "@/store/calendarStore";

// --- Veri modeli (spec ile birebir) ---
export interface Surprise {
  id: string;
  title: string; // ör. "Doğum günün için 🎂"
  content: string; // mesaj metni
  photoUri?: string; // opsiyonel fotoğraf
  unlockType: UnlockType;
  unlockDate?: string; // unlockType 'date' veya 'before_trip' ise
  isOpened: boolean;
  openedAt?: string;
}

interface SurpriseState {
  surprises: Surprise[];
  hidratlandiMi: boolean;
  setHidratlandi: (deger: boolean) => void;

  // Yeni sürpriz ekler ve oluşturulan kaydı döndürür
  addSurprise: (girdi: Omit<Surprise, "id" | "isOpened" | "openedAt">) => Surprise;
  // Bir sürprizi açar (içeriği görünür hale gelir)
  openSurprise: (id: string) => void;
  // Sürprizi siler
  deleteSurprise: (id: string) => void;
  // Şu an açılabilir durumdaki (koşulu sağlanmış, henüz açılmamış) sürprizler
  getUnlockableSurprises: () => Surprise[];
  // sad/miss için: o tipte açılmamış ilk sürprizi açar, açtığını döndürür
  openByType: (tip: Extract<UnlockType, "sad" | "miss">) => Surprise | null;
  // Tek bir sürprizin şu anda açılabilir olup olmadığını söyler
  acilabilirMi: (s: Surprise) => boolean;
}

function yeniId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// İki ISO tarih arasındaki tam gün farkı (hedef - bugün).
function kalanGun(hedefISO: string, bugun: Date = new Date()): number {
  const birGunMs = 1000 * 60 * 60 * 24;
  const bugunBaslangic = new Date(
    bugun.getFullYear(),
    bugun.getMonth(),
    bugun.getDate()
  );
  return Math.round(
    (isoToDate(hedefISO).getTime() - bugunBaslangic.getTime()) / birGunMs
  );
}

// Takvimden bugünden sonraki (veya bugünkü) en yakın 'tatil' etkinliğine
// kalan gün sayısını bulur. Tatil yoksa null döner.
function enYakinTatileKalanGun(): number | null {
  const events = useCalendarStore.getState().events;
  const buISO = bugunISO();

  const tatiller = events
    .filter((e) => e.category === "tatil" && e.date >= buISO)
    .map((e) => kalanGun(e.date))
    .filter((k) => k >= 0)
    .sort((a, b) => a - b);

  return tatiller.length > 0 ? tatiller[0] : null;
}

// Bir sürprizin koşulunun sağlanıp sağlanmadığını hesaplar.
function kosulSaglandiMi(s: Surprise): boolean {
  switch (s.unlockType) {
    case "date":
      // Bugün >= unlockDate ise açılabilir
      return s.unlockDate ? bugunISO() >= s.unlockDate : false;

    case "before_trip": {
      // En yakın tatile <= eşik gün kala açılabilir
      const kalan = enYakinTatileKalanGun();
      if (kalan == null) return false;
      return kalan <= TATIL_ESIK_GUN;
    }

    case "sad":
    case "miss":
      // Bu tipler her zaman elle (buton ile) açılabilir
      return true;

    default:
      return false;
  }
}

export const useSurpriseStore = create<SurpriseState>()(
  persist(
    (set, get) => ({
      surprises: [],
      hidratlandiMi: false,
      setHidratlandi: (deger) => set({ hidratlandiMi: deger }),

      addSurprise: (girdi) => {
        const yeni: Surprise = { ...girdi, id: yeniId(), isOpened: false };
        set((s) => ({ surprises: [...s.surprises, yeni] }));
        return yeni;
      },

      openSurprise: (id) => {
        set((s) => ({
          surprises: s.surprises.map((x) =>
            x.id === id
              ? { ...x, isOpened: true, openedAt: new Date().toISOString() }
              : x
          ),
        }));
      },

      deleteSurprise: (id) => {
        set((s) => ({ surprises: s.surprises.filter((x) => x.id !== id) }));
      },

      acilabilirMi: (s) => !s.isOpened && kosulSaglandiMi(s),

      getUnlockableSurprises: () => {
        return get().surprises.filter((s) => !s.isOpened && kosulSaglandiMi(s));
      },

      openByType: (tip) => {
        // O tipte, henüz açılmamış ilk sürprizi bul ve aç
        const hedef = get().surprises.find(
          (s) => s.unlockType === tip && !s.isOpened
        );
        if (!hedef) return null;
        get().openSurprise(hedef.id);
        // Güncel (açılmış) hali döndür
        return { ...hedef, isOpened: true, openedAt: new Date().toISOString() };
      },
    }),
    {
      name: "sevgilim-cepte-surprizler",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s): { surprises: Surprise[] } => ({ surprises: s.surprises }),
      onRehydrateStorage: () => (state) => {
        state?.setHidratlandi(true);
      },
    }
  )
);
