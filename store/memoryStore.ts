// ====================================================================
// ANI STORE (Zustand + AsyncStorage persist)
// ====================================================================
// Anılar yerel olarak telefonda saklanır (backend henüz yok).
// Fotoğraflar şimdilik cihazdaki yerel URI olarak tutulur; ileride
// Supabase Storage'a taşınacak.
// ====================================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// --- Veri modeli (spec ile birebir) ---
export interface Memory {
  id: string;
  photoUri: string; // cihazdaki yerel fotoğraf yolu
  date: string; // ISO format: "YYYY-MM-DD"
  note: string;
  isFavorite: boolean;
  locationName?: string; // ör. "Kapadokya"
  latitude?: number;
  longitude?: number;
}

interface MemoryState {
  memories: Memory[];
  hidratlandiMi: boolean;
  setHidratlandi: (deger: boolean) => void;

  // Yeni anı ekler ve oluşturulan kaydı döndürür
  addMemory: (girdi: Omit<Memory, "id">) => Memory;
  // Var olan anıyı günceller
  updateMemory: (id: string, degisiklikler: Partial<Memory>) => void;
  // Anıyı siler
  deleteMemory: (id: string) => void;
  // Favori durumunu değiştirir
  toggleFavorite: (id: string) => void;
  // Tek bir anıyı getirir
  getMemoryById: (id: string) => Memory | undefined;
  // Belirli bir günün (gün+ay) geçmiş yıllardaki anılarını getirir
  getMemoriesByDate: (tarih?: Date) => Memory[];
  // Konum bilgisi olan anıları getirir (harita için)
  getMemoriesWithLocation: () => Memory[];
}

// Basit benzersiz kimlik üretici
function yeniId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set, get) => ({
      memories: [],
      hidratlandiMi: false,
      setHidratlandi: (deger) => set({ hidratlandiMi: deger }),

      addMemory: (girdi) => {
        const yeni: Memory = { ...girdi, id: yeniId() };
        set((s) => ({ memories: [...s.memories, yeni] }));
        return yeni;
      },

      updateMemory: (id, degisiklikler) => {
        set((s) => ({
          memories: s.memories.map((m) =>
            m.id === id ? { ...m, ...degisiklikler } : m
          ),
        }));
      },

      deleteMemory: (id) => {
        set((s) => ({ memories: s.memories.filter((m) => m.id !== id) }));
      },

      toggleFavorite: (id) => {
        set((s) => ({
          memories: s.memories.map((m) =>
            m.id === id ? { ...m, isFavorite: !m.isFavorite } : m
          ),
        }));
      },

      getMemoryById: (id) => get().memories.find((m) => m.id === id),

      getMemoriesByDate: (tarih = new Date()) => {
        const ay = tarih.getMonth();
        const gun = tarih.getDate();
        return get()
          .memories.filter((m) => {
            const [y, mo, g] = m.date.split("-").map(Number);
            return mo - 1 === ay && g === gun;
          })
          // En eski yıl en üstte değil; en yeni anı üstte
          .sort((a, b) => b.date.localeCompare(a.date));
      },

      getMemoriesWithLocation: () => {
        return get().memories.filter(
          (m) => m.latitude != null && m.longitude != null
        );
      },
    }),
    {
      name: "sevgilim-cepte-anilar", // AsyncStorage anahtarı
      storage: createJSONStorage(() => AsyncStorage),
      // Yalnızca anı listesini diske yaz
      partialize: (s): { memories: Memory[] } => ({ memories: s.memories }),
      onRehydrateStorage: () => (state) => {
        state?.setHidratlandi(true);
      },
    }
  )
);
