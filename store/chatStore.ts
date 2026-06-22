// ====================================================================
// SOHBET STORE (Zustand + AsyncStorage persist)
// ====================================================================
// Feyzi ile metin sohbetini yönetir: mesaj geçmişi, seçili mod,
// gönderme ve temizleme. Geçmiş cihazda kalıcı tutulur.
// ====================================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { FeyziMode } from "@/constants/feyziPrompts";
import { tarihKisa } from "@/constants/tarih";
import { FeyziError, feyziyeSor, SohbetMesaji } from "@/services/feyziService";
import { useMemoryStore } from "@/store/memoryStore";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  // Hata mesajı mı? (bağlam olarak API'ye gönderilmez)
  hata?: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  currentMode: FeyziMode;
  isLoading: boolean;

  setMode: (mode: FeyziMode) => void;
  sendMessage: (metin: string) => Promise<void>;
  clearChat: () => void;
}

function yeniId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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

      clearChat: () => set({ messages: [], isLoading: false }),
    }),
    {
      name: "sevgilim-cepte-sohbet",
      storage: createJSONStorage(() => AsyncStorage),
      // Yükleme durumunu değil, sadece mesaj ve modu kalıcı yap
      partialize: (s): { messages: ChatMessage[]; currentMode: FeyziMode } => ({
        messages: s.messages,
        currentMode: s.currentMode,
      }),
    }
  )
);
