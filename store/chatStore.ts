// ====================================================================
// SOHBET STORE (Zustand + Supabase chat_messages + tool onayı)
// ====================================================================
// Feyzi ile metin sohbetini yönetir. Function calling sonuçları:
//  - Yazma araçları → sohbette onay kartı (Evet/Hayır)
//  - Başarılı işlem → "✅ Takvime eklendi" bilgi kartı
// Mesaj geçmişi Supabase'de kişisel; kartlar (onay/bilgi) yalnızca
// oturum boyunca yerelde tutulur (DB'ye yazılmaz).
// ====================================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { FeyziMode } from "@/constants/feyziPrompts";
import { tarihKisa } from "@/constants/tarih";
import { supabase } from "@/lib/supabase";
import {
  BekleyenOnay,
  BilgiKarti,
  FeyziError,
  FeyziYanit,
  feyziyeSor,
  onayReddiDevam,
  onaySonrasiDevam,
  SohbetMesaji,
} from "@/services/feyziService";
import { useMemoryStore } from "@/store/memoryStore";

export type ChatMesajTipi = "text" | "onay" | "bilgi";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  // Hata mesajı mı? (bağlam olarak API'ye gönderilmez, DB'ye yazılmaz)
  hata?: boolean;
  // Kart tipi (varsayılan: text)
  tip?: ChatMesajTipi;
  // Onay kartı durumu
  onayDurum?: "bekliyor" | "onaylandi" | "reddedildi";
  // Bilgi kartı metni (✅ ...)
  bilgiMetni?: string;
}

interface ChatMessageRow {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode: FeyziMode;
  user_id: string;
  created_at: string;
}

interface ChatState {
  messages: ChatMessage[];
  currentMode: FeyziMode;
  isLoading: boolean;
  // Onay bekleyen tool call (tek seferde bir)
  bekleyenOnay: BekleyenOnay | null;
  // Onay kartının mesaj id'si
  bekleyenOnayMesajId: string | null;

  fetchMessages: () => Promise<void>;
  setMode: (mode: FeyziMode) => void;
  sendMessage: (metin: string) => Promise<void>;
  onayla: () => Promise<void>;
  reddet: () => Promise<void>;
  clearChat: () => Promise<void>;
}

function yeniId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function mesajKaydet(
  role: "user" | "assistant",
  content: string,
  mode: FeyziMode
): Promise<void> {
  const { error } = await supabase
    .from("chat_messages")
    .insert({ role, content, mode });
  if (error) console.warn("[chatStore] mesajKaydet hatası:", error.message);
}

function anilarBaglami(): string {
  const anilar = useMemoryStore.getState().memories;
  if (anilar.length === 0) return "";
  return [...anilar]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
    .map((m) => {
      const yer = m.locationName ? ` (${m.locationName})` : "";
      const not = m.note ? m.note : "(notsuz anı)";
      return `- ${tarihKisa(m.date)}${yer}: ${not}`;
    })
    .join("\n");
}

function hataMesaji(e: unknown): string {
  if (e instanceof FeyziError) {
    if (e.kod === "NO_KEY")
      return "API anahtarım eksik gibi 💭 (.env dosyana OPENAI_API_KEY ekler misin?)";
    if (e.kod === "AG")
      return "İnternete ulaşamadım sanki, bağlantını kontrol eder misin? 🌐";
  }
  return "Şu an cevap veremedim, birazdan tekrar dener misin canım? 💕";
}

function bilgiMesajlari(bilgiler?: BilgiKarti[]): ChatMessage[] {
  if (!bilgiler || bilgiler.length === 0) return [];
  return bilgiler.map((b) => ({
    id: yeniId(),
    role: "assistant" as const,
    content: b.metin,
    createdAt: Date.now(),
    tip: "bilgi" as const,
    bilgiMetni: b.metin,
  }));
}

/** FeyziYanit'ı sohbet mesajlarına dönüştürür; onay varsa state'e yazar. */
function yanitiIsle(
  yanit: FeyziYanit,
  set: (
    partial:
      | Partial<ChatState>
      | ((s: ChatState) => Partial<ChatState>)
  ) => void,
  mod: FeyziMode
) {
  if (yanit.tur === "onay") {
    const onayMsg: ChatMessage = {
      id: yeniId(),
      role: "assistant",
      content: yanit.onay.ozet,
      createdAt: Date.now(),
      tip: "onay",
      onayDurum: "bekliyor",
    };
    set((s) => ({
      messages: [...s.messages, onayMsg],
      isLoading: false,
      bekleyenOnay: yanit.onay,
      bekleyenOnayMesajId: onayMsg.id,
    }));
    return;
  }

  const ekstra = bilgiMesajlari(yanit.bilgiler);
  const botMsg: ChatMessage = {
    id: yeniId(),
    role: "assistant",
    content: yanit.metin,
    createdAt: Date.now(),
  };
  set((s) => ({
    messages: [...s.messages, ...ekstra, botMsg],
    isLoading: false,
    bekleyenOnay: null,
    bekleyenOnayMesajId: null,
  }));
  void mesajKaydet("assistant", yanit.metin, mod);
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      currentMode: "normal",
      isLoading: false,
      bekleyenOnay: null,
      bekleyenOnayMesajId: null,

      fetchMessages: async () => {
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .order("created_at", { ascending: true });

        if (error) {
          console.warn("[chatStore] fetchMessages hatası:", error.message);
          return;
        }

        set({
          messages: (data as ChatMessageRow[]).map((r) => ({
            id: r.id,
            role: r.role,
            content: r.content,
            createdAt: new Date(r.created_at).getTime(),
          })),
          bekleyenOnay: null,
          bekleyenOnayMesajId: null,
        });
      },

      setMode: (mode) => set({ currentMode: mode }),

      sendMessage: async (metin) => {
        const temiz = metin.trim();
        if (temiz === "" || get().isLoading) return;
        // Onay beklerken yeni mesaj gönderme (karışıklık olmasın)
        if (get().bekleyenOnay) return;

        const userMsg: ChatMessage = {
          id: yeniId(),
          role: "user",
          content: temiz,
          createdAt: Date.now(),
        };
        set((s) => ({ messages: [...s.messages, userMsg], isLoading: true }));
        void mesajKaydet("user", temiz, get().currentMode);

        try {
          const mod = get().currentMode;
          const gecmis: SohbetMesaji[] = get()
            .messages.filter((m) => !m.hata && (!m.tip || m.tip === "text"))
            .map((m) => ({ role: m.role, content: m.content }));

          const anilar = mod === "ani" ? anilarBaglami() : undefined;
          const yanit = await feyziyeSor(gecmis, mod, anilar);
          yanitiIsle(yanit, set, mod);
        } catch (e) {
          const errMsg: ChatMessage = {
            id: yeniId(),
            role: "assistant",
            content: hataMesaji(e),
            createdAt: Date.now(),
            hata: true,
          };
          set((s) => ({
            messages: [...s.messages, errMsg],
            isLoading: false,
          }));
        }
      },

      onayla: async () => {
        const onay = get().bekleyenOnay;
        const mesajId = get().bekleyenOnayMesajId;
        if (!onay || get().isLoading) return;

        if (mesajId) {
          set((s) => ({
            messages: s.messages.map((m) =>
              m.id === mesajId ? { ...m, onayDurum: "onaylandi" } : m
            ),
            isLoading: true,
            bekleyenOnay: null,
            bekleyenOnayMesajId: null,
          }));
        } else {
          set({ isLoading: true, bekleyenOnay: null, bekleyenOnayMesajId: null });
        }

        try {
          const mod = get().currentMode;
          const yanit = await onaySonrasiDevam(onay);
          yanitiIsle(yanit, set, mod);
        } catch (e) {
          const errMsg: ChatMessage = {
            id: yeniId(),
            role: "assistant",
            content: hataMesaji(e),
            createdAt: Date.now(),
            hata: true,
          };
          set((s) => ({
            messages: [...s.messages, errMsg],
            isLoading: false,
          }));
        }
      },

      reddet: async () => {
        const onay = get().bekleyenOnay;
        const mesajId = get().bekleyenOnayMesajId;
        if (!onay || get().isLoading) return;

        if (mesajId) {
          set((s) => ({
            messages: s.messages.map((m) =>
              m.id === mesajId ? { ...m, onayDurum: "reddedildi" } : m
            ),
            isLoading: true,
            bekleyenOnay: null,
            bekleyenOnayMesajId: null,
          }));
        } else {
          set({ isLoading: true, bekleyenOnay: null, bekleyenOnayMesajId: null });
        }

        try {
          const mod = get().currentMode;
          const yanit = await onayReddiDevam(onay);
          yanitiIsle(yanit, set, mod);
        } catch (e) {
          const errMsg: ChatMessage = {
            id: yeniId(),
            role: "assistant",
            content: hataMesaji(e),
            createdAt: Date.now(),
            hata: true,
          };
          set((s) => ({
            messages: [...s.messages, errMsg],
            isLoading: false,
          }));
        }
      },

      clearChat: async () => {
        set({
          messages: [],
          isLoading: false,
          bekleyenOnay: null,
          bekleyenOnayMesajId: null,
        });
        const { error } = await supabase
          .from("chat_messages")
          .delete()
          .gte("created_at", "1970-01-01T00:00:00Z");
        if (error) console.warn("[chatStore] clearChat hatası:", error.message);
      },
    }),
    {
      name: "sevgilim-cepte-sohbet",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s): { currentMode: FeyziMode } => ({
        currentMode: s.currentMode,
      }),
    }
  )
);
