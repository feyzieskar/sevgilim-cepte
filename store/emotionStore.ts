// ====================================================================
// DUYGU STORE (Zustand + Supabase + Realtime)
// ====================================================================
// "Karnım Acıktı" ve "Sevgi Saati" istekleri emotion_events tablosuna
// yazılır; partner'a sendPushToPartner ile uzaktan push gider.
// Realtime ile partner isteği anında listede görünür.
// ====================================================================

import { RealtimeChannel } from "@supabase/supabase-js";
import { create } from "zustand";

import { aciklikEtiketi, AciklikSeviyesi, rastgeleYemekOner } from "@/data/yemekOnerileri";
import { supabase } from "@/lib/supabase";
import { sendPushToPartner } from "@/services/pushService";
import { useAuthStore } from "@/store/authStore";

export type EmotionType = "hungry" | "love";

export type SevgiEylemi = "sarilmak" | "opucuk" | "ozledim" | "el_ele" | "ses";

export interface EmotionEvent {
  id: string;
  type: EmotionType;
  level?: AciklikSeviyesi;
  action?: SevgiEylemi;
  suggestion?: string;
  createdBy: string;
  createdAt: string;
}

/** Sevgi Saati butonları — etiket + action kodu */
export const SEVGI_EYLEMLERI: {
  action: SevgiEylemi;
  etiket: string;
  gecmis: string;
  partnerGecmis: string;
}[] = [
  {
    action: "sarilmak",
    etiket: "Sarılmak istiyorum 🤗",
    gecmis: "Sarılmak istedin 🤗",
    partnerGecmis: "Sarılmak istedi 🤗",
  },
  {
    action: "opucuk",
    etiket: "Öpücük istiyorum 😘",
    gecmis: "Öpücük istedin 😘",
    partnerGecmis: "Öpücük istedi 😘",
  },
  {
    action: "ozledim",
    etiket: "Seni özledim 🥺",
    gecmis: "Seni özledin 🥺",
    partnerGecmis: "Seni özledi 🥺",
  },
  {
    action: "el_ele",
    etiket: "El ele tutuşalım 🤝",
    gecmis: "El ele tutuşmak istedin 🤝",
    partnerGecmis: "El ele tutuşmak istedi 🤝",
  },
  {
    action: "ses",
    etiket: "Sesini duymak istiyorum 📞",
    gecmis: "Sesini duymak istedin 📞",
    partnerGecmis: "Sesini duymak istedi 📞",
  },
];

interface EmotionRow {
  id: string;
  type: EmotionType;
  level: AciklikSeviyesi | null;
  action: SevgiEylemi | null;
  suggestion: string | null;
  created_by: string;
  created_at: string;
}

interface EmotionState {
  events: EmotionEvent[];
  yuklendiMi: boolean;
  loading: boolean;
  gonderiliyor: boolean;

  fetchEvents: () => Promise<void>;
  sendHungry: (level: AciklikSeviyesi) => Promise<EmotionEvent | null>;
  sendLove: (action: SevgiEylemi) => Promise<EmotionEvent | null>;
  subscribeRealtime: () => () => void;
}

function satiriEmotionCevir(r: EmotionRow): EmotionEvent {
  return {
    id: r.id,
    type: r.type,
    level: r.level ?? undefined,
    action: r.action ?? undefined,
    suggestion: r.suggestion ?? undefined,
    createdBy: r.created_by,
    createdAt: r.created_at,
  };
}

/** Sevgi eylemi kodundan kullanıcı etiketini bulur. */
export function sevgiEylemEtiketi(action: SevgiEylemi): string {
  return SEVGI_EYLEMLERI.find((x) => x.action === action)?.etiket ?? action;
}

let emotionKanali: RealtimeChannel | null = null;

export const useEmotionStore = create<EmotionState>((set, get) => ({
  events: [],
  yuklendiMi: false,
  loading: false,
  gonderiliyor: false,

  fetchEvents: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from("emotion_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.warn("[emotionStore] fetchEvents hatası:", error.message);
      set({ loading: false, yuklendiMi: true });
      return;
    }

    set({
      events: (data as EmotionRow[]).map(satiriEmotionCevir),
      loading: false,
      yuklendiMi: true,
    });
  },

  sendHungry: async (level) => {
    if (get().gonderiliyor) return null;
    set({ gonderiliyor: true });

    const suggestion = rastgeleYemekOner(level);
    const seviyeEtiket = aciklikEtiketi(level);

    const { data, error } = await supabase
      .from("emotion_events")
      .insert({
        type: "hungry",
        level,
        suggestion,
      })
      .select()
      .single();

    set({ gonderiliyor: false });

    if (error || !data) {
      console.warn("[emotionStore] sendHungry hatası:", error?.message);
      return null;
    }

    const yeni = satiriEmotionCevir(data as EmotionRow);
    set((s) => (s.events.some((x) => x.id === yeni.id) ? s : { events: [yeni, ...s.events] }));

    void sendPushToPartner("Sevgilin acıkmış! 🍽️", `'${seviyeEtiket}' — önerdiğim: ${suggestion}`, {
      screen: "duygular",
    });

    return yeni;
  },

  sendLove: async (action) => {
    if (get().gonderiliyor) return null;
    set({ gonderiliyor: true });

    const mesaj = sevgiEylemEtiketi(action);

    const { data, error } = await supabase
      .from("emotion_events")
      .insert({
        type: "love",
        action,
      })
      .select()
      .single();

    set({ gonderiliyor: false });

    if (error || !data) {
      console.warn("[emotionStore] sendLove hatası:", error?.message);
      return null;
    }

    const yeni = satiriEmotionCevir(data as EmotionRow);
    set((s) => (s.events.some((x) => x.id === yeni.id) ? s : { events: [yeni, ...s.events] }));

    void sendPushToPartner("Sevgin seni istiyor 💕", mesaj, {
      screen: "duygular",
    });

    return yeni;
  },

  subscribeRealtime: () => {
    if (emotionKanali) return () => {};

    emotionKanali = supabase
      .channel("emotion-events-degisiklikleri")
      .on("postgres_changes", { event: "*", schema: "public", table: "emotion_events" }, () => {
        get().fetchEvents();
      })
      .subscribe();

    return () => {
      if (emotionKanali) {
        supabase.removeChannel(emotionKanali);
        emotionKanali = null;
      }
    };
  },
}));

/** Geçmiş satırı için Türkçe metin üretir. */
export function emotionGecmisMetni(event: EmotionEvent, benimId: string | undefined): string {
  const benim = event.createdBy === benimId;

  if (event.type === "hungry") {
    const seviye = event.level ? aciklikEtiketi(event.level) : "";
    const yemek = event.suggestion ?? "";
    if (benim) {
      return `${seviye} dedin — öneri: ${yemek}`;
    }
    return `Sevgilin ${seviye.toLowerCase()} — öneri: ${yemek}`;
  }

  const etiket = event.action ? sevgiEylemEtiketi(event.action) : "";
  const meta = SEVGI_EYLEMLERI.find((x) => x.action === event.action);
  if (meta) {
    return benim ? meta.gecmis : meta.partnerGecmis;
  }
  return etiket;
}

/** ISO zaman damgasını "14:30" biçimine çevirir. */
export function saatFormat(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}
