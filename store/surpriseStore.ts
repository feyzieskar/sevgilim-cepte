// ====================================================================
// SÜRPRİZ STORE (Zustand + Supabase + Storage + Realtime)
// ====================================================================
// Sürprizler artık bulutta (Supabase "surprises" tablosu) saklanır.
// Ben bir sürpriz eklediğimde sevgilimin ekranında Realtime ile ANINDA
// görünür; uzaktan push (sendPushToPartner) partner'ın telefonuna düşer.
// Fotoğraflar "surprise-media" bucket'ına yüklenir.
// before_trip koşulu için calendarStore okunur.
// ====================================================================

import { RealtimeChannel } from "@supabase/supabase-js";
import { create } from "zustand";

import { TATIL_ESIK_GUN, UnlockType } from "@/constants/surpriz";
import { bugunISO, isoToDate } from "@/constants/tarih";
import { supabase } from "@/lib/supabase";
import { sendPushToPartner } from "@/services/pushService";
import { fotoSil, fotoYukle } from "@/services/storageService";
import { useCalendarStore } from "@/store/calendarStore";

// --- Veri modeli (uygulama tarafı) ---
export interface Surprise {
  id: string;
  title: string;
  content: string;
  photoUri?: string; // Supabase Storage public URL
  unlockType: UnlockType;
  unlockDate?: string;
  isOpened: boolean;
  openedAt?: string;
}

// Form/store girdisi: yeni fotoğraf seçildiyse base64 da taşınır
export type SurprizGirdi = Omit<Surprise, "id" | "isOpened" | "openedAt"> & {
  photoBase64?: string;
};

// --- Supabase "surprises" satırı (snake_case) ---
interface SurpriseRow {
  id: string;
  title: string;
  content: string;
  photo_url: string | null;
  unlock_type: UnlockType;
  unlock_date: string | null;
  is_opened: boolean;
  opened_at: string | null;
  created_by: string;
  created_at: string;
}

interface SurpriseState {
  surprises: Surprise[];
  yuklendiMi: boolean;
  loading: boolean;

  fetchSurprises: () => Promise<void>;
  addSurprise: (girdi: SurprizGirdi) => Promise<Surprise | null>;
  openSurprise: (id: string) => Promise<void>;
  deleteSurprise: (id: string) => Promise<void>;
  getUnlockableSurprises: () => Surprise[];
  openByType: (
    tip: Extract<UnlockType, "sad" | "miss">
  ) => Promise<Surprise | null>;
  acilabilirMi: (s: Surprise) => boolean;
  // Realtime aboneliği kurar; temizleme fonksiyonu döndürür
  subscribeRealtime: () => () => void;
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

// Takvimden bugünden sonraki en yakın 'tatil' etkinliğine kalan gün.
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
      return s.unlockDate ? bugunISO() >= s.unlockDate : false;
    case "before_trip": {
      const kalan = enYakinTatileKalanGun();
      if (kalan == null) return false;
      return kalan <= TATIL_ESIK_GUN;
    }
    case "sad":
    case "miss":
      return true;
    default:
      return false;
  }
}

function satiriSurprizeCevir(r: SurpriseRow): Surprise {
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    photoUri: r.photo_url ?? undefined,
    unlockType: r.unlock_type,
    unlockDate: r.unlock_date ?? undefined,
    isOpened: r.is_opened,
    openedAt: r.opened_at ?? undefined,
  };
}

// Tek bir Realtime kanalı (çift abonelik kurmamak için modül seviyesinde)
let surprizKanali: RealtimeChannel | null = null;

export const useSurpriseStore = create<SurpriseState>((set, get) => ({
  surprises: [],
  yuklendiMi: false,
  loading: false,

  fetchSurprises: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from("surprises")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[surpriseStore] fetchSurprises hatası:", error.message);
      set({ loading: false, yuklendiMi: true });
      return;
    }

    set({
      surprises: (data as SurpriseRow[]).map(satiriSurprizeCevir),
      loading: false,
      yuklendiMi: true,
    });
  },

  addSurprise: async (girdi) => {
    // Fotoğraf seçildiyse önce Storage'a yükle
    let photoUrl = girdi.photoUri;
    if (girdi.photoBase64) {
      const url = await fotoYukle("surprise-media", girdi.photoBase64);
      if (url) photoUrl = url;
    }

    const { data, error } = await supabase
      .from("surprises")
      .insert({
        title: girdi.title,
        content: girdi.content,
        photo_url: photoUrl ?? null,
        unlock_type: girdi.unlockType,
        unlock_date: girdi.unlockDate ?? null,
        is_opened: false,
      })
      .select()
      .single();

    if (error || !data) {
      console.warn("[surpriseStore] addSurprise hatası:", error?.message);
      return null;
    }

    const yeni = satiriSurprizeCevir(data as SurpriseRow);
    // Realtime kendi eklediğimizi de geri gönderebilir; tekrarı önlemek için
    // id kontrolüyle ekliyoruz.
    set((s) =>
      s.surprises.some((x) => x.id === yeni.id)
        ? s
        : { surprises: [yeni, ...s.surprises] }
    );

    // Partner'a uzaktan push (uygulama kapalıyken bile ulaşır)
    void sendPushToPartner(
      "Sana bir sürpriz var 🎁",
      "Sevgilin senin için yeni bir sürpriz sakladı 💕",
      { screen: "duygular" }
    );

    return yeni;
  },

  openSurprise: async (id) => {
    const acilmaZamani = new Date().toISOString();
    // İyimser güncelle
    set((s) => ({
      surprises: s.surprises.map((x) =>
        x.id === id ? { ...x, isOpened: true, openedAt: acilmaZamani } : x
      ),
    }));

    const { error } = await supabase
      .from("surprises")
      .update({ is_opened: true, opened_at: acilmaZamani })
      .eq("id", id);
    if (error) {
      console.warn("[surpriseStore] openSurprise hatası:", error.message);
    }
  },

  deleteSurprise: async (id) => {
    const mevcut = get().surprises.find((x) => x.id === id);
    const { error } = await supabase.from("surprises").delete().eq("id", id);
    if (error) {
      console.warn("[surpriseStore] deleteSurprise hatası:", error.message);
    }
    if (mevcut?.photoUri) await fotoSil("surprise-media", mevcut.photoUri);
    set((s) => ({ surprises: s.surprises.filter((x) => x.id !== id) }));
  },

  acilabilirMi: (s) => !s.isOpened && kosulSaglandiMi(s),

  getUnlockableSurprises: () => {
    return get().surprises.filter((s) => !s.isOpened && kosulSaglandiMi(s));
  },

  openByType: async (tip) => {
    const hedef = get().surprises.find(
      (s) => s.unlockType === tip && !s.isOpened
    );
    if (!hedef) return null;
    await get().openSurprise(hedef.id);
    return { ...hedef, isOpened: true, openedAt: new Date().toISOString() };
  },

  subscribeRealtime: () => {
    if (surprizKanali) return () => {};

    surprizKanali = supabase
      .channel("surprises-degisiklikleri")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "surprises" },
        (_payload) => {
          // Listeyi tazele; uzaktan push gönderimi ekleyen tarafta yapılır
          // (sendPushToPartner) — burada yerel bildirim yok.
          get().fetchSurprises();
        }
      )
      .subscribe();

    return () => {
      if (surprizKanali) {
        supabase.removeChannel(surprizKanali);
        surprizKanali = null;
      }
    };
  },
}));
