// ====================================================================
// SOHBET STORE (Zustand + Supabase chat_messages)
// ====================================================================
// Feyzi ile metin sohbetini yönetir: mesaj geçmişi, seçili mod,
// gönderme ve temizleme. Mesaj geçmişi Supabase "chat_messages"
// tablosunda KİŞİSEL olarak saklanır (partner göremez, RLS user_id'ye
// bağlı). Böylece kullanıcı kendi cihazları arasında geçmişine erişir.
// Seçili mod cihazda yereldedir (AsyncStorage).
// ====================================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { FeyziMode } from "@/constants/feyziPrompts";
import { tarihKisa } from "@/constants/tarih";
import { supabase } from "@/lib/supabase";
import { FeyziError, feyziyeSor, SohbetMesaji } from "@/services/feyziService";
import { useMemoryStore } from "@/store/memoryStore";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  // Hata mesajı mı? (bağlam olarak API'ye gönderilmez, DB'ye yazılmaz)
  hata?: boolean;
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

  fetchMessages: () => Promise<void>;
  setMode: (mode: FeyziMode) => void;
  sendMessage: (metin: string) => Promise<void>;
  clearChat: () => Promise<void>;
}

function yeniId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// Başarılı bir mesajı (hata balonu değil) buluta kaydeder.
// user_id DB tarafında auth.uid() ile otomatik atanır.
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

// Anı modu için son anılardan kısa bir bağlam metni üretir.
function anilarBaglami(): string {
  const anilar = useMemoryStore.getState().memories;
  if (anilar.length === 0) return "";
  // En yeni 5 anı
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

// Hata koduna göre kullanıcıya gösterilecek nazik mesaj
function hataMesaji(e: unknown): string {
  if (e instanceof FeyziError) {
    if (e.kod === "NO_KEY")
      return "API anahtarım eksik gibi 💭 (.env dosyana OPENAI_API_KEY ekler misin?)";
    if (e.kod === "AG")
      return "İnternete ulaşamadım sanki, bağlantını kontrol eder misin? 🌐";
  }
  return "Şu an cevap veremedim, birazdan tekrar dener misin canım? 💕";
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      currentMode: "normal",
      isLoading: false,

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
        });
      },

      setMode: (mode) => set({ currentMode: mode }),

      sendMessage: async (metin) => {
        const temiz = metin.trim();
        if (temiz === "" || get().isLoading) return;

        // Kullanıcı mesajını ekle
        const userMsg: ChatMessage = {
          id: yeniId(),
          role: "user",
          content: temiz,
          createdAt: Date.now(),
        };
        set((s) => ({ messages: [...s.messages, userMsg], isLoading: true }));
        // Kullanıcı mesajını buluta yaz (beklemeden)
        void mesajKaydet("user", temiz, get().currentMode);

        try {
          const mod = get().currentMode;

          // API'ye gönderilecek geçmiş (hata balonları hariç)
          const gecmis: SohbetMesaji[] = get()
            .messages.filter((m) => !m.hata)
            .map((m) => ({ role: m.role, content: m.content }));

          const anilar = mod === "ani" ? anilarBaglami() : undefined;
          const cevap = await feyziyeSor(gecmis, mod, anilar);

          const botMsg: ChatMessage = {
            id: yeniId(),
            role: "assistant",
            content: cevap,
            createdAt: Date.now(),
          };
          set((s) => ({ messages: [...s.messages, botMsg], isLoading: false }));
          // Feyzi'nin cevabını buluta yaz (hata balonları yazılmaz)
          void mesajKaydet("assistant", cevap, mod);
        } catch (e) {
          const errMsg: ChatMessage = {
            id: yeniId(),
            role: "assistant",
            content: hataMesaji(e),
            createdAt: Date.now(),
            hata: true,
          };
          set((s) => ({ messages: [...s.messages, errMsg], isLoading: false }));
        }
      },

      clearChat: async () => {
        set({ messages: [], isLoading: false });
        // Buluttaki kendi mesajlarını sil (RLS sadece kendi satırlarına izin verir)
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
      // Mesajlar artık bulutta; yerelde yalnızca seçili modu kalıcı yap
      partialize: (s): { currentMode: FeyziMode } => ({
        currentMode: s.currentMode,
      }),
    }
  )
);
