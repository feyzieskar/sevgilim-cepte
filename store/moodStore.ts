// ====================================================================
// MOOD STORE (Zustand + Supabase + Realtime)
// ====================================================================
// Günlük ruh hali paylaşımı. Aynı gün için upsert (tek kayıt / kullanıcı).
// ====================================================================

import { RealtimeChannel } from "@supabase/supabase-js";
import { create } from "zustand";

import { bugunISO } from "@/constants/tarih";
import { MoodTipi, moodBilgisi, dusukMoodMu } from "@/data/moods";
import { supabase } from "@/lib/supabase";
import { sendPushToPartner } from "@/services/pushService";
import { useAuthStore } from "@/store/authStore";

export interface MoodKaydi {
  id: string;
  mood: MoodTipi;
  emoji: string;
  note?: string;
  moodDate: string;
  createdBy: string;
  createdAt: string;
}

export interface GunlukMoodOzet {
  date: string;
  benim?: MoodKaydi;
  partnerin?: MoodKaydi;
}

interface MoodRow {
  id: string;
  mood: MoodTipi;
  emoji: string | null;
  note: string | null;
  mood_date: string;
  created_by: string;
  created_at: string;
}

interface MoodState {
  todayMoods: MoodKaydi[];
  history: GunlukMoodOzet[];
  partnerId: string | null;
  yuklendiMi: boolean;
  loading: boolean;
  kaydediliyor: boolean;

  yukle: () => Promise<void>;
  fetchTodayMoods: () => Promise<void>;
  fetchMoodHistory: (days?: number) => Promise<void>;
  setTodayMood: (mood: MoodTipi, emoji: string, note?: string) => Promise<MoodKaydi | null>;
  subscribeRealtime: () => () => void;
}

function satiriMoodCevir(r: MoodRow): MoodKaydi {
  const bilgi = moodBilgisi(r.mood);
  return {
    id: r.id,
    mood: r.mood,
    emoji: r.emoji ?? bilgi.emoji,
    note: r.note ?? undefined,
    moodDate: r.mood_date,
    createdBy: r.created_by,
    createdAt: r.created_at,
  };
}

async function partnerIdBul(): Promise<string | null> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return null;

  const { data: profil } = await supabase
    .from("profiles")
    .select("partner_id")
    .eq("id", userId)
    .maybeSingle();

  if (profil?.partner_id) return profil.partner_id as string;

  const { data: ters } = await supabase
    .from("profiles")
    .select("id")
    .eq("partner_id", userId)
    .maybeSingle();

  return (ters?.id as string | undefined) ?? null;
}

function goruntulenenAdAl(): string {
  const u = useAuthStore.getState().user;
  if (!u) return "Sevgilin";
  const ad = (u.user_metadata?.display_name as string | undefined)?.trim();
  if (ad) return ad;
  const eposta = u.email?.split("@")[0];
  return eposta && eposta.length > 0 ? eposta : "Sevgilin";
}

function gunlukOzetOlustur(
  moods: MoodKaydi[],
  userId?: string,
  partnerId?: string | null
): GunlukMoodOzet[] {
  const gunlereGore = new Map<string, MoodKaydi[]>();

  for (const m of moods) {
    const liste = gunlereGore.get(m.moodDate) ?? [];
    liste.push(m);
    gunlereGore.set(m.moodDate, liste);
  }

  return [...gunlereGore.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, kayitlar]) => ({
      date,
      benim: kayitlar.find((k) => k.createdBy === userId),
      partnerin: partnerId ? kayitlar.find((k) => k.createdBy === partnerId) : undefined,
    }));
}

let moodKanali: RealtimeChannel | null = null;

export const useMoodStore = create<MoodState>((set, get) => ({
  todayMoods: [],
  history: [],
  partnerId: null,
  yuklendiMi: false,
  loading: false,
  kaydediliyor: false,

  yukle: async () => {
    set({ loading: true });
    const partnerId = await partnerIdBul();
    set({ partnerId });
    await Promise.all([get().fetchTodayMoods(), get().fetchMoodHistory(30)]);
    set({ loading: false, yuklendiMi: true });
  },

  fetchTodayMoods: async () => {
    const bugun = bugunISO();
    const { data, error } = await supabase
      .from("moods")
      .select("*")
      .eq("mood_date", bugun)
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("[moodStore] fetchTodayMoods hatası:", error.message);
      return;
    }

    set({ todayMoods: (data as MoodRow[]).map(satiriMoodCevir) });
  },

  fetchMoodHistory: async (days = 30) => {
    const userId = useAuthStore.getState().user?.id;
    const partnerId = get().partnerId ?? (await partnerIdBul());
    if (partnerId && get().partnerId !== partnerId) {
      set({ partnerId });
    }

    const baslangic = new Date();
    baslangic.setDate(baslangic.getDate() - (days - 1));
    const baslangicISO = bugunISO(baslangic);

    const { data, error } = await supabase
      .from("moods")
      .select("*")
      .gte("mood_date", baslangicISO)
      .order("mood_date", { ascending: false });

    if (error) {
      console.warn("[moodStore] fetchMoodHistory hatası:", error.message);
      return;
    }

    const moods = (data as MoodRow[]).map(satiriMoodCevir);
    set({ history: gunlukOzetOlustur(moods, userId, partnerId) });
  },

  setTodayMood: async (mood, emoji, note) => {
    if (get().kaydediliyor) return null;
    set({ kaydediliyor: true });

    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      set({ kaydediliyor: false });
      return null;
    }

    const bugun = bugunISO();
    const { data, error } = await supabase
      .from("moods")
      .upsert(
        {
          mood,
          emoji,
          note: note?.trim() || null,
          mood_date: bugun,
          created_by: userId,
        },
        { onConflict: "created_by,mood_date" }
      )
      .select()
      .single();

    set({ kaydediliyor: false });

    if (error || !data) {
      console.warn("[moodStore] setTodayMood hatası:", error?.message);
      return null;
    }

    const yeni = satiriMoodCevir(data as MoodRow);
    set((s) => {
      const digerleri = s.todayMoods.filter((m) => m.createdBy !== userId);
      return { todayMoods: [...digerleri, yeni] };
    });

    await get().fetchMoodHistory(30);

    const ad = goruntulenenAdAl();
    const bilgi = moodBilgisi(mood);

    if (dusukMoodMu(mood)) {
      void sendPushToPartner(
        "Sevgilin desteğe ihtiyaç duyuyor 💙",
        `${ad} bugün ${bilgi.emoji} ${bilgi.etiket.toLowerCase()} hissediyor. Ona moral ver.`,
        { screen: "ruh-hali" }
      );
    } else {
      void sendPushToPartner(
        "Ruh hali güncellendi 🌈",
        `${ad} bugün ${bilgi.emoji} ${bilgi.etiket.toLowerCase()} hissediyor.`,
        { screen: "ruh-hali" }
      );
    }

    return yeni;
  },

  subscribeRealtime: () => {
    if (moodKanali) return () => {};

    moodKanali = supabase
      .channel("mood-degisiklikleri")
      .on("postgres_changes", { event: "*", schema: "public", table: "moods" }, () => {
        void get().fetchTodayMoods();
        void get().fetchMoodHistory(30);
      })
      .subscribe();

    return () => {
      if (moodKanali) {
        supabase.removeChannel(moodKanali);
        moodKanali = null;
      }
    };
  },
}));

/** ISO zaman damgasını "14:30" biçimine çevirir. */
export function moodSaatFormat(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}
