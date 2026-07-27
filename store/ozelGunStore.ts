// ====================================================================
// ÖZEL GÜN STORE (Zustand + Supabase + Realtime)
// ====================================================================
// "Bize özel günler" (yıldönümü, doğum günleri...) her yıl tekrar eder.
// Yıl tutulmaz; sadece ay (1-12) ve gün (1-31). Çift ORTAK görür/düzenler
// (Supabase "special_days" tablosu, RLS partner bağlantısına göre).
// Realtime ile partnerin eklediği/düzenlediği gün anında yansır.
// ====================================================================

import { RealtimeChannel } from "@supabase/supabase-js";
import { create } from "zustand";

import type { OzelGun } from "@/data/ozelGunler";
import { supabase } from "@/lib/supabase";

// special_days satırı (snake_case)
interface OzelGunRow {
  id: string;
  title: string;
  emoji: string;
  month: number;
  day: number;
  created_by: string;
  created_at: string;
}

// Ekleme/güncelleme girdisi (id ve created_* yönetimi DB'de)
export type OzelGunGirdi = Omit<OzelGun, "id">;

interface OzelGunState {
  ozelGunler: OzelGun[];
  yuklendiMi: boolean;
  loading: boolean;

  fetchOzelGunler: () => Promise<void>;
  addOzelGun: (girdi: OzelGunGirdi) => Promise<OzelGun | null>;
  updateOzelGun: (id: string, girdi: OzelGunGirdi) => Promise<void>;
  deleteOzelGun: (id: string) => Promise<void>;
  subscribeRealtime: () => () => void;
}

function satiriOzelGuneCevir(r: OzelGunRow): OzelGun {
  return {
    id: r.id,
    baslik: r.title,
    emoji: r.emoji,
    ay: r.month,
    gun: r.day,
  };
}

// Tek bir Realtime kanalı (çift abonelik kurmamak için modül seviyesinde)
let ozelGunKanali: RealtimeChannel | null = null;

export const useOzelGunStore = create<OzelGunState>((set, get) => ({
  ozelGunler: [],
  yuklendiMi: false,
  loading: false,

  fetchOzelGunler: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from("special_days")
      .select("*")
      .order("month", { ascending: true })
      .order("day", { ascending: true });

    if (error) {
      console.warn("[ozelGunStore] fetchOzelGunler hatası:", error.message);
      set({ loading: false, yuklendiMi: true });
      return;
    }

    set({
      ozelGunler: (data as OzelGunRow[]).map(satiriOzelGuneCevir),
      loading: false,
      yuklendiMi: true,
    });
  },

  addOzelGun: async (girdi) => {
    const { data, error } = await supabase
      .from("special_days")
      .insert({
        title: girdi.baslik.trim(),
        emoji: girdi.emoji,
        month: girdi.ay,
        day: girdi.gun,
      })
      .select()
      .single();

    if (error || !data) {
      console.warn("[ozelGunStore] addOzelGun hatası:", error?.message);
      return null;
    }

    const yeni = satiriOzelGuneCevir(data as OzelGunRow);
    set((s) =>
      s.ozelGunler.some((x) => x.id === yeni.id)
        ? s
        : { ozelGunler: [...s.ozelGunler, yeni] }
    );
    return yeni;
  },

  updateOzelGun: async (id, girdi) => {
    // İyimser güncelle
    set((s) => ({
      ozelGunler: s.ozelGunler.map((x) =>
        x.id === id
          ? {
              ...x,
              baslik: girdi.baslik.trim(),
              emoji: girdi.emoji,
              ay: girdi.ay,
              gun: girdi.gun,
            }
          : x
      ),
    }));

    const { error } = await supabase
      .from("special_days")
      .update({
        title: girdi.baslik.trim(),
        emoji: girdi.emoji,
        month: girdi.ay,
        day: girdi.gun,
      })
      .eq("id", id);
    if (error) {
      console.warn("[ozelGunStore] updateOzelGun hatası:", error.message);
    }
  },

  deleteOzelGun: async (id) => {
    const { error } = await supabase
      .from("special_days")
      .delete()
      .eq("id", id);
    if (error) {
      console.warn("[ozelGunStore] deleteOzelGun hatası:", error.message);
    }
    set((s) => ({ ozelGunler: s.ozelGunler.filter((x) => x.id !== id) }));
  },

  subscribeRealtime: () => {
    if (ozelGunKanali) return () => {};

    ozelGunKanali = supabase
      .channel("special-days-degisiklikleri")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "special_days" },
        () => {
          get().fetchOzelGunler();
        }
      )
      .subscribe();

    return () => {
      if (ozelGunKanali) {
        supabase.removeChannel(ozelGunKanali);
        ozelGunKanali = null;
      }
    };
  },
}));
