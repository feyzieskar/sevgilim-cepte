// ====================================================================
// BUCKET LIST STORE (Zustand + Supabase + Storage + Realtime)
// ====================================================================

import { RealtimeChannel } from "@supabase/supabase-js";
import { create } from "zustand";

import { BucketKategori } from "@/data/bucketList";
import { supabase } from "@/lib/supabase";
import { sendPushToPartner } from "@/services/pushService";
import { fotoYukle } from "@/services/storageService";
import { useAuthStore } from "@/store/authStore";

export interface BucketItem {
  id: string;
  title: string;
  description?: string;
  category: BucketKategori;
  emoji: string;
  isCompleted: boolean;
  completedAt?: string;
  completedPhotoUrl?: string;
  targetDate?: string;
  createdBy: string;
  createdAt: string;
}

export type BucketGirdi = {
  title: string;
  description?: string;
  category: BucketKategori;
  emoji?: string;
  targetDate?: string;
};

interface BucketRow {
  id: string;
  title: string;
  description: string | null;
  category: BucketKategori;
  emoji: string | null;
  is_completed: boolean;
  completed_at: string | null;
  completed_photo_url: string | null;
  target_date: string | null;
  created_by: string;
  created_at: string;
}

interface BucketListState {
  items: BucketItem[];
  yuklendiMi: boolean;
  loading: boolean;
  kaydediliyor: boolean;

  fetchItems: () => Promise<void>;
  addItem: (girdi: BucketGirdi) => Promise<BucketItem | null>;
  updateItem: (id: string, degisiklikler: Partial<BucketGirdi>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleComplete: (
    id: string,
    photoBase64?: string
  ) => Promise<BucketItem | null>;
  subscribeRealtime: () => () => void;
}

function satiriItemCevir(r: BucketRow): BucketItem {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? undefined,
    category: r.category,
    emoji: r.emoji ?? "✨",
    isCompleted: r.is_completed,
    completedAt: r.completed_at ?? undefined,
    completedPhotoUrl: r.completed_photo_url ?? undefined,
    targetDate: r.target_date ?? undefined,
    createdBy: r.created_by,
    createdAt: r.created_at,
  };
}

function goruntulenenAdAl(): string {
  const u = useAuthStore.getState().user;
  if (!u) return "Sevgilin";
  const ad = (u.user_metadata?.display_name as string | undefined)?.trim();
  if (ad) return ad;
  const eposta = u.email?.split("@")[0];
  return eposta && eposta.length > 0 ? eposta : "Sevgilin";
}

let bucketKanali: RealtimeChannel | null = null;

export const useBucketListStore = create<BucketListState>((set, get) => ({
  items: [],
  yuklendiMi: false,
  loading: false,
  kaydediliyor: false,

  fetchItems: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from("bucket_list")
      .select("*")
      .order("is_completed", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[bucketListStore] fetchItems hatası:", error.message);
      set({ loading: false, yuklendiMi: true });
      return;
    }

    set({
      items: (data as BucketRow[]).map(satiriItemCevir),
      loading: false,
      yuklendiMi: true,
    });
  },

  addItem: async (girdi) => {
    if (get().kaydediliyor) return null;
    set({ kaydediliyor: true });

    const { data, error } = await supabase
      .from("bucket_list")
      .insert({
        title: girdi.title.trim(),
        description: girdi.description?.trim() || null,
        category: girdi.category,
        emoji: girdi.emoji ?? null,
        target_date: girdi.targetDate ?? null,
      })
      .select()
      .single();

    set({ kaydediliyor: false });

    if (error || !data) {
      console.warn("[bucketListStore] addItem hatası:", error?.message);
      return null;
    }

    const yeni = satiriItemCevir(data as BucketRow);
    set((s) => ({ items: [yeni, ...s.items] }));

    const ad = goruntulenenAdAl();
    void sendPushToPartner(
      "Yeni hayal eklendi ✨",
      `${ad} yeni bir hayal ekledi: ${yeni.title} ✨`,
      { screen: "bucket-list" }
    );

    return yeni;
  },

  updateItem: async (id, degisiklikler) => {
    const row: Record<string, unknown> = {};
    if (degisiklikler.title !== undefined) row.title = degisiklikler.title.trim();
    if (degisiklikler.description !== undefined)
      row.description = degisiklikler.description?.trim() || null;
    if (degisiklikler.category !== undefined) row.category = degisiklikler.category;
    if (degisiklikler.emoji !== undefined) row.emoji = degisiklikler.emoji;
    if (degisiklikler.targetDate !== undefined)
      row.target_date = degisiklikler.targetDate ?? null;

    if (Object.keys(row).length === 0) return;

    const { error } = await supabase.from("bucket_list").update(row).eq("id", id);
    if (error) {
      console.warn("[bucketListStore] updateItem hatası:", error.message);
      return;
    }

    set((s) => ({
      items: s.items.map((item) =>
        item.id === id ? { ...item, ...degisiklikler } : item
      ),
    }));
  },

  deleteItem: async (id) => {
    const { error } = await supabase.from("bucket_list").delete().eq("id", id);
    if (error) {
      console.warn("[bucketListStore] deleteItem hatası:", error.message);
      return;
    }
    set((s) => ({ items: s.items.filter((item) => item.id !== id) }));
  },

  toggleComplete: async (id, photoBase64) => {
    const mevcut = get().items.find((i) => i.id === id);
    if (!mevcut) return null;

    const tamamlanacak = !mevcut.isCompleted;
    let completedPhotoUrl: string | undefined;

    if (tamamlanacak && photoBase64) {
      const url = await fotoYukle("memory-photos", photoBase64);
      if (url) completedPhotoUrl = url;
    }

    const { data, error } = await supabase
      .from("bucket_list")
      .update({
        is_completed: tamamlanacak,
        completed_at: tamamlanacak ? new Date().toISOString() : null,
        completed_photo_url: tamamlanacak
          ? completedPhotoUrl ?? mevcut.completedPhotoUrl ?? null
          : null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      console.warn("[bucketListStore] toggleComplete hatası:", error?.message);
      return null;
    }

    const guncel = satiriItemCevir(data as BucketRow);
    set((s) => ({
      items: s.items.map((item) => (item.id === id ? guncel : item)),
    }));

    if (tamamlanacak) {
      void sendPushToPartner(
        "Hayal gerçekleşti! 🎉",
        `Bir hayali gerçekleştirdiniz! 🎉 ${guncel.title}`,
        { screen: "bucket-list" }
      );
    }

    return guncel;
  },

  subscribeRealtime: () => {
    if (bucketKanali) return () => {};

    bucketKanali = supabase
      .channel("bucket-list-degisiklikleri")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bucket_list" },
        () => {
          void get().fetchItems();
        }
      )
      .subscribe();

    return () => {
      if (bucketKanali) {
        supabase.removeChannel(bucketKanali);
        bucketKanali = null;
      }
    };
  },
}));
