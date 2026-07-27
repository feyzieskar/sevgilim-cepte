// ====================================================================
// STREAK STORE (Zustand + Supabase + Storage + Realtime)
// ====================================================================
// Günlük fotoğraf serisi: ikisi de aynı gün gönderirse streak +1.
// Bir gün eksik kalırsa seri sıfırlanır. Gün sınırı yerel 00:00.
// ====================================================================

import { RealtimeChannel } from "@supabase/supabase-js";
import { create } from "zustand";

import { bugunISO, isoToDate } from "@/constants/tarih";
import { supabase } from "@/lib/supabase";
import { sendPushToPartner } from "@/services/pushService";
import { fotoYukle } from "@/services/storageService";
import { useAuthStore } from "@/store/authStore";

export interface StreakPhoto {
  id: string;
  photoUrl: string;
  caption?: string;
  sentDate: string;
  createdBy: string;
  createdAt: string;
}

export interface StreakDurumu {
  coupleKey: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate?: string;
}

export interface GunlukOzet {
  date: string;
  photos: StreakPhoto[];
  tamamlandi: boolean;
}

interface StreakPhotoRow {
  id: string;
  photo_url: string;
  caption: string | null;
  sent_date: string;
  created_by: string;
  created_at: string;
}

interface StreakRow {
  couple_key: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  updated_at: string;
}

interface StreakState {
  todayPhotos: StreakPhoto[];
  history: GunlukOzet[];
  streak: StreakDurumu | null;
  partnerId: string | null;
  yuklendiMi: boolean;
  loading: boolean;
  gonderiliyor: boolean;

  fetchTodayPhotos: () => Promise<void>;
  fetchStreakHistory: () => Promise<void>;
  fetchStreak: () => Promise<void>;
  recalculateStreak: () => Promise<void>;
  sendStreakPhoto: (
    photoUri: string,
    photoBase64: string,
    caption?: string
  ) => Promise<StreakPhoto | null>;
  subscribeRealtime: () => () => void;
  yukle: () => Promise<void>;
}

function satiriFotoyaCevir(r: StreakPhotoRow): StreakPhoto {
  return {
    id: r.id,
    photoUrl: r.photo_url,
    caption: r.caption ?? undefined,
    sentDate: r.sent_date,
    createdBy: r.created_by,
    createdAt: r.created_at,
  };
}

function satiriStreakCevir(r: StreakRow): StreakDurumu {
  return {
    coupleKey: r.couple_key,
    currentStreak: r.current_streak,
    longestStreak: r.longest_streak,
    lastCompletedDate: r.last_completed_date ?? undefined,
  };
}

/** Yerel gün bazında bir önceki günün ISO tarihi. */
export function dunISO(iso: string): string {
  const d = isoToDate(iso);
  d.setDate(d.getDate() - 1);
  return bugunISO(d);
}

/** İki ISO tarih ardışık gün mü? (a < b) */
function ardisikGun(a: string, b: string): boolean {
  return dunISO(b) === a;
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

async function coupleKeyOlustur(): Promise<string | null> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return null;

  const partnerId = await partnerIdBul();
  if (!partnerId) return null;

  return [userId, partnerId].sort().join(":");
}

/** Fotoğraf listesinden "ikisi de gönderdi" günlerini çıkarır. */
export function tamamlananGunleriBul(
  photos: StreakPhoto[],
  userIds: string[]
): string[] {
  if (userIds.length < 2) return [];

  const gunlereGore = new Map<string, Set<string>>();
  for (const p of photos) {
    if (!gunlereGore.has(p.sentDate)) {
      gunlereGore.set(p.sentDate, new Set());
    }
    gunlereGore.get(p.sentDate)!.add(p.createdBy);
  }

  const tamamlanan: string[] = [];
  for (const [gun, gonderenler] of gunlereGore) {
    const hepsiGonderdi = userIds.every((id) => gonderenler.has(id));
    if (hepsiGonderdi) tamamlanan.push(gun);
  }

  return tamamlanan.sort();
}

/** Bugünden geriye ardışık tamamlanan gün sayısı. */
export function mevcutStreakHesapla(
  tamamlananGunler: string[],
  bugun: string = bugunISO()
): number {
  const set = new Set(tamamlananGunler);
  if (set.size === 0) return 0;

  let baslangic = bugun;
  if (!set.has(bugun)) {
    baslangic = dunISO(bugun);
  }

  let streak = 0;
  let gun = baslangic;
  while (set.has(gun)) {
    streak++;
    gun = dunISO(gun);
  }

  return streak;
}

/** Tüm geçmişteki en uzun ardışık tamamlanan gün serisi. */
export function enUzunStreakHesapla(tamamlananGunler: string[]): number {
  if (tamamlananGunler.length === 0) return 0;

  const sirali = [...tamamlananGunler].sort();
  let enUzun = 1;
  let mevcut = 1;

  for (let i = 1; i < sirali.length; i++) {
    if (ardisikGun(sirali[i - 1], sirali[i])) {
      mevcut++;
      enUzun = Math.max(enUzun, mevcut);
    } else {
      mevcut = 1;
    }
  }

  return enUzun;
}

function gunlukOzetOlustur(
  photos: StreakPhoto[],
  userIds: string[]
): GunlukOzet[] {
  const gunlereGore = new Map<string, StreakPhoto[]>();

  for (const p of photos) {
    const liste = gunlereGore.get(p.sentDate) ?? [];
    liste.push(p);
    gunlereGore.set(p.sentDate, liste);
  }

  return [...gunlereGore.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, gunFotolari]) => {
      const gonderenler = new Set(gunFotolari.map((f) => f.createdBy));
      const tamamlandi =
        userIds.length >= 2 && userIds.every((id) => gonderenler.has(id));
      return { date, photos: gunFotolari, tamamlandi };
    });
}

let streakKanali: RealtimeChannel | null = null;

export const useStreakStore = create<StreakState>((set, get) => ({
  todayPhotos: [],
  history: [],
  streak: null,
  partnerId: null,
  yuklendiMi: false,
  loading: false,
  gonderiliyor: false,

  yukle: async () => {
    set({ loading: true });
    const partnerId = await partnerIdBul();
    set({ partnerId });
    await Promise.all([
      get().fetchTodayPhotos(),
      get().fetchStreakHistory(),
      get().fetchStreak(),
    ]);
    await get().recalculateStreak();
    set({ loading: false, yuklendiMi: true });
  },

  fetchTodayPhotos: async () => {
    const bugun = bugunISO();
    const { data, error } = await supabase
      .from("streak_photos")
      .select("*")
      .eq("sent_date", bugun)
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("[streakStore] fetchTodayPhotos hatası:", error.message);
      return;
    }

    set({ todayPhotos: (data as StreakPhotoRow[]).map(satiriFotoyaCevir) });
  },

  fetchStreakHistory: async () => {
    const { data, error } = await supabase
      .from("streak_photos")
      .select("*")
      .order("sent_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(120);

    if (error) {
      console.warn("[streakStore] fetchStreakHistory hatası:", error.message);
      return;
    }

    const photos = (data as StreakPhotoRow[]).map(satiriFotoyaCevir);
    const userId = useAuthStore.getState().user?.id;
    const partnerId = get().partnerId ?? (await partnerIdBul());
    const userIds = [userId, partnerId].filter(Boolean) as string[];

    if (partnerId && get().partnerId !== partnerId) {
      set({ partnerId });
    }

    set({ history: gunlukOzetOlustur(photos, userIds) });
  },

  fetchStreak: async () => {
    const coupleKey = await coupleKeyOlustur();
    const partnerId = await partnerIdBul();
    set({ partnerId });

    if (!coupleKey) {
      set({ streak: null });
      return;
    }

    const { data, error } = await supabase
      .from("streaks")
      .select("*")
      .eq("couple_key", coupleKey)
      .maybeSingle();

    if (error) {
      console.warn("[streakStore] fetchStreak hatası:", error.message);
      return;
    }

    if (data) {
      set({ streak: satiriStreakCevir(data as StreakRow) });
    } else {
      set({
        streak: {
          coupleKey,
          currentStreak: 0,
          longestStreak: 0,
        },
      });
    }
  },

  recalculateStreak: async () => {
    const coupleKey = await coupleKeyOlustur();
    const userId = useAuthStore.getState().user?.id;
    const partnerId = await partnerIdBul();
    if (!coupleKey || !userId || !partnerId) return;

    const userIds = [userId, partnerId];

    const { data, error } = await supabase
      .from("streak_photos")
      .select("*")
      .order("sent_date", { ascending: true });

    if (error) {
      console.warn("[streakStore] recalculateStreak okuma hatası:", error.message);
      return;
    }

    const photos = (data as StreakPhotoRow[]).map(satiriFotoyaCevir);
    const tamamlanan = tamamlananGunleriBul(photos, userIds);
    const bugun = bugunISO();
    const currentStreak = mevcutStreakHesapla(tamamlanan, bugun);
    const longestStreak = Math.max(
      enUzunStreakHesapla(tamamlanan),
      get().streak?.longestStreak ?? 0,
      currentStreak
    );
    const lastCompletedDate =
      tamamlanan.length > 0 ? tamamlanan[tamamlanan.length - 1] : null;

    const { data: upserted, error: upsertHata } = await supabase
      .from("streaks")
      .upsert(
        {
          couple_key: coupleKey,
          current_streak: currentStreak,
          longest_streak: longestStreak,
          last_completed_date: lastCompletedDate,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "couple_key" }
      )
      .select()
      .single();

    if (upsertHata) {
      console.warn(
        "[streakStore] recalculateStreak yazma hatası:",
        upsertHata.message
      );
      return;
    }

    set({
      streak: satiriStreakCevir(upserted as StreakRow),
      history: gunlukOzetOlustur(photos, userIds),
    });
  },

  sendStreakPhoto: async (_photoUri, photoBase64, caption) => {
    if (get().gonderiliyor) return null;
    set({ gonderiliyor: true });

    const url = await fotoYukle("streak-photos", photoBase64);
    if (!url) {
      set({ gonderiliyor: false });
      return null;
    }

    const bugun = bugunISO();
    const { data, error } = await supabase
      .from("streak_photos")
      .insert({
        photo_url: url,
        caption: caption?.trim() || null,
        sent_date: bugun,
      })
      .select()
      .single();

    if (error || !data) {
      console.warn("[streakStore] sendStreakPhoto hatası:", error?.message);
      set({ gonderiliyor: false });
      return null;
    }

    const yeni = satiriFotoyaCevir(data as StreakPhotoRow);
    set((s) => ({
      todayPhotos: [...s.todayPhotos, yeni],
      gonderiliyor: false,
    }));

    await get().recalculateStreak();
    await get().fetchTodayPhotos();

    const ad = goruntulenenAdAl();
    void sendPushToPartner(
      "Streak fotoğrafı 📸",
      `${ad || "Sevgilin"} bugünkü fotoğrafını gönderdi 📸`,
      { screen: "streak" }
    );

    return yeni;
  },

  subscribeRealtime: () => {
    if (streakKanali) return () => {};

    streakKanali = supabase
      .channel("streak-degisiklikleri")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "streak_photos" },
        () => {
          void get().fetchTodayPhotos();
          void get().fetchStreakHistory();
          void get().recalculateStreak();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "streaks" },
        () => {
          void get().fetchStreak();
        }
      )
      .subscribe();

    return () => {
      if (streakKanali) {
        supabase.removeChannel(streakKanali);
        streakKanali = null;
      }
    };
  },
}));

/** Kullanıcı bugün fotoğraf göndermiş mi? */
export function benBugunGonderdimMi(
  todayPhotos: StreakPhoto[],
  userId?: string
): boolean {
  if (!userId) return false;
  return todayPhotos.some((p) => p.createdBy === userId);
}

/** Partner bugün fotoğraf göndermiş mi? */
export function partnerBugunGonderdiMi(
  todayPhotos: StreakPhoto[],
  partnerId?: string | null
): boolean {
  if (!partnerId) return false;
  return todayPhotos.some((p) => p.createdBy === partnerId);
}

/** Bugün ikisi de gönderdi mi? */
export function bugunTamamlandiMi(
  todayPhotos: StreakPhoto[],
  userId?: string,
  partnerId?: string | null
): boolean {
  return (
    benBugunGonderdimMi(todayPhotos, userId) &&
    partnerBugunGonderdiMi(todayPhotos, partnerId)
  );
}
