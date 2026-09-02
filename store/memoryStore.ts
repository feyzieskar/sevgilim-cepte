// ====================================================================
// ANI STORE (Zustand + Supabase + Storage)
// ====================================================================
// Anılar artık bulutta (Supabase "memories" tablosu) saklanır; fotoğraflar
// "memory-photos" Storage bucket'ına yüklenip public URL olarak kaydedilir.
// Böylece ben ve sevgilim aynı anıları senkron görürüz.
//
// Form yeni bir fotoğraf seçtiğinde base64 gönderir; store bunu Storage'a
// yükler ve dönen public URL'i photoUri (=photo_url) olarak saklar. Düzenleme
// sırasında fotoğraf değişmediyse base64 gelmez ve mevcut URL korunur.
// ====================================================================

import { create } from "zustand";

import { supabase } from "@/lib/supabase";
import { fotoSil, fotoYukle } from "@/services/storageService";

// --- Veri modeli (uygulama tarafı) ---
export interface Memory {
  id: string;
  photoUri: string; // Supabase Storage public URL
  date: string; // ISO format: "YYYY-MM-DD"
  note: string;
  isFavorite: boolean;
  locationName?: string;
  latitude?: number;
  longitude?: number;
}

// Form/store girdisi: yeni fotoğraf seçildiyse base64 da taşınır
export type MemoryGirdi = Omit<Memory, "id"> & { photoBase64?: string };

// --- Supabase "memories" satırı (snake_case) ---
interface MemoryRow {
  id: string;
  photo_url: string | null;
  date: string;
  note: string | null;
  is_favorite: boolean;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  created_by: string;
  created_at: string;
}

interface MemoryState {
  memories: Memory[];
  yuklendiMi: boolean;
  loading: boolean;

  // Supabase'den tüm anıları çeker (RLS: ben + partner)
  fetchMemories: () => Promise<void>;
  // Yeni anı ekler (gerekirse fotoğrafı yükler); kaydı döndürür
  addMemory: (girdi: MemoryGirdi) => Promise<Memory | null>;
  // Anıyı günceller (yeni fotoğraf varsa yükler)
  updateMemory: (id: string, degisiklikler: Partial<MemoryGirdi>) => Promise<void>;
  // Anıyı (ve fotoğrafını) siler
  deleteMemory: (id: string) => Promise<void>;
  // Favori durumunu değiştirir (buluta yazar)
  toggleFavorite: (id: string) => Promise<void>;
  // Tek bir anıyı getirir
  getMemoryById: (id: string) => Memory | undefined;
  // Belirli bir günün (gün+ay) geçmiş yıllardaki anılarını getirir
  getMemoriesByDate: (tarih?: Date) => Memory[];
  // Konum bilgisi olan anıları getirir (harita için)
  getMemoriesWithLocation: () => Memory[];
}

// DB satırını uygulama modeline çevirir
function satiriMemoryeCevir(r: MemoryRow): Memory {
  return {
    id: r.id,
    photoUri: r.photo_url ?? "",
    date: r.date,
    note: r.note ?? "",
    isFavorite: r.is_favorite,
    locationName: r.location_name ?? undefined,
    latitude: r.latitude ?? undefined,
    longitude: r.longitude ?? undefined,
  };
}

export const useMemoryStore = create<MemoryState>((set, get) => ({
  memories: [],
  yuklendiMi: false,
  loading: false,

  fetchMemories: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from("memories")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.warn("[memoryStore] fetchMemories hatası:", error.message);
      set({ loading: false, yuklendiMi: true });
      return;
    }

    set({
      memories: (data as MemoryRow[]).map(satiriMemoryeCevir),
      loading: false,
      yuklendiMi: true,
    });
  },

  addMemory: async (girdi) => {
    // Yeni fotoğraf seçildiyse önce Storage'a yükle
    let photoUrl = girdi.photoUri;
    if (girdi.photoBase64) {
      const url = await fotoYukle("memory-photos", girdi.photoBase64);
      if (!url) return null;
      photoUrl = url;
    }

    const { data, error } = await supabase
      .from("memories")
      .insert({
        photo_url: photoUrl,
        date: girdi.date,
        note: girdi.note || null,
        is_favorite: girdi.isFavorite,
        location_name: girdi.locationName ?? null,
        latitude: girdi.latitude ?? null,
        longitude: girdi.longitude ?? null,
      })
      .select()
      .single();

    if (error || !data) {
      console.warn("[memoryStore] addMemory hatası:", error?.message);
      return null;
    }

    const yeni = satiriMemoryeCevir(data as MemoryRow);
    set((s) => ({ memories: [yeni, ...s.memories] }));
    return yeni;
  },

  updateMemory: async (id, degisiklikler) => {
    const mevcut = get().memories.find((m) => m.id === id);

    // Yeni fotoğraf seçildiyse yükle (ve eskiyi sil)
    let photoUrl = degisiklikler.photoUri;
    if (degisiklikler.photoBase64) {
      const url = await fotoYukle("memory-photos", degisiklikler.photoBase64);
      if (url) {
        photoUrl = url;
        if (mevcut?.photoUri) await fotoSil("memory-photos", mevcut.photoUri);
      }
    }

    // DB güncelleme nesnesini kur (yalnızca verilen alanlar)
    const row: Record<string, unknown> = {};
    if (photoUrl !== undefined) row.photo_url = photoUrl;
    if (degisiklikler.date !== undefined) row.date = degisiklikler.date;
    if (degisiklikler.note !== undefined) row.note = degisiklikler.note || null;
    if (degisiklikler.isFavorite !== undefined) row.is_favorite = degisiklikler.isFavorite;
    if (degisiklikler.locationName !== undefined)
      row.location_name = degisiklikler.locationName ?? null;
    if (degisiklikler.latitude !== undefined) row.latitude = degisiklikler.latitude ?? null;
    if (degisiklikler.longitude !== undefined) row.longitude = degisiklikler.longitude ?? null;

    if (Object.keys(row).length > 0) {
      const { error } = await supabase.from("memories").update(row).eq("id", id);
      if (error) {
        console.warn("[memoryStore] updateMemory hatası:", error.message);
      }
    }

    // Yerel state'i iyimser güncelle (base64'ü modele yazma)
    const { photoBase64: _atla, ...modelDegisiklikleri } = degisiklikler;
    set((s) => ({
      memories: s.memories.map((m) =>
        m.id === id ? { ...m, ...modelDegisiklikleri, photoUri: photoUrl ?? m.photoUri } : m
      ),
    }));
  },

  deleteMemory: async (id) => {
    const mevcut = get().memories.find((m) => m.id === id);

    const { error } = await supabase.from("memories").delete().eq("id", id);
    if (error) {
      console.warn("[memoryStore] deleteMemory hatası:", error.message);
    }

    // Fotoğrafı Storage'dan da temizle (yetim dosya bırakma)
    if (mevcut?.photoUri) await fotoSil("memory-photos", mevcut.photoUri);

    set((s) => ({ memories: s.memories.filter((m) => m.id !== id) }));
  },

  toggleFavorite: async (id) => {
    const mevcut = get().memories.find((m) => m.id === id);
    if (!mevcut) return;
    const yeniDeger = !mevcut.isFavorite;

    // İyimser güncelle, sonra buluta yaz
    set((s) => ({
      memories: s.memories.map((m) => (m.id === id ? { ...m, isFavorite: yeniDeger } : m)),
    }));

    const { error } = await supabase
      .from("memories")
      .update({ is_favorite: yeniDeger })
      .eq("id", id);

    if (error) {
      console.warn("[memoryStore] toggleFavorite hatası:", error.message);
      // Hata olursa geri al
      set((s) => ({
        memories: s.memories.map((m) => (m.id === id ? { ...m, isFavorite: !yeniDeger } : m)),
      }));
    }
  },

  getMemoryById: (id) => get().memories.find((m) => m.id === id),

  getMemoriesByDate: (tarih = new Date()) => {
    const ay = tarih.getMonth();
    const gun = tarih.getDate();
    return get()
      .memories.filter((m) => {
        const [, mo, g] = m.date.split("-").map(Number);
        return mo - 1 === ay && g === gun;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  getMemoriesWithLocation: () => {
    return get().memories.filter((m) => m.latitude != null && m.longitude != null);
  },
}));
