// ====================================================================
// SEVME SEBEBİ STORE (Zustand + Supabase + Realtime)
// ====================================================================
// "Bugün seni sevme sebebim" kartı için ÖZEL sebepler. Yerleşik liste
// (data/sevmeSebepleri.ts) her zaman vardır; buna ek olarak çiftin
// kendi yazdığı sebepler Supabase "love_reasons" tablosunda ORTAK
// tutulur (partner de görür/ekler). Realtime ile anında senkronlanır.
// ====================================================================

import { RealtimeChannel } from "@supabase/supabase-js";
import { create } from "zustand";

import { supabase } from "@/lib/supabase";

export interface LoveReason {
  id: string;
  text: string;
  createdAt: number;
}

interface LoveReasonRow {
  id: string;
  text: string;
  created_by: string;
  created_at: string;
}

interface LoveReasonState {
  reasons: LoveReason[];
  yuklendiMi: boolean;
  loading: boolean;

  fetchReasons: () => Promise<void>;
  addReason: (text: string) => Promise<LoveReason | null>;
  deleteReason: (id: string) => Promise<void>;
  subscribeRealtime: () => () => void;
}

function satiriSebebeCevir(r: LoveReasonRow): LoveReason {
  return {
    id: r.id,
    text: r.text,
    createdAt: new Date(r.created_at).getTime(),
  };
}

// Tek bir Realtime kanalı (çift abonelik kurmamak için modül seviyesinde)
let sebepKanali: RealtimeChannel | null = null;

export const useLoveReasonStore = create<LoveReasonState>((set, get) => ({
  reasons: [],
  yuklendiMi: false,
  loading: false,

  fetchReasons: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from("love_reasons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[loveReasonStore] fetchReasons hatası:", error.message);
      set({ loading: false, yuklendiMi: true });
      return;
    }

    set({
      reasons: (data as LoveReasonRow[]).map(satiriSebebeCevir),
      loading: false,
      yuklendiMi: true,
    });
  },

  addReason: async (text) => {
    const temiz = text.trim();
    if (temiz === "") return null;

    const { data, error } = await supabase
      .from("love_reasons")
      .insert({ text: temiz })
      .select()
      .single();

    if (error || !data) {
      console.warn("[loveReasonStore] addReason hatası:", error?.message);
      return null;
    }

    const yeni = satiriSebebeCevir(data as LoveReasonRow);
    set((s) =>
      s.reasons.some((x) => x.id === yeni.id)
        ? s
        : { reasons: [yeni, ...s.reasons] }
    );
    return yeni;
  },

  deleteReason: async (id) => {
    const { error } = await supabase.from("love_reasons").delete().eq("id", id);
    if (error) {
      console.warn("[loveReasonStore] deleteReason hatası:", error.message);
    }
    set((s) => ({ reasons: s.reasons.filter((x) => x.id !== id) }));
  },

  subscribeRealtime: () => {
    if (sebepKanali) return () => {};

    sebepKanali = supabase
      .channel("love-reasons-degisiklikleri")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "love_reasons" },
        () => {
          get().fetchReasons();
        }
      )
      .subscribe();

    return () => {
      if (sebepKanali) {
        supabase.removeChannel(sebepKanali);
        sebepKanali = null;
      }
    };
  },
}));
