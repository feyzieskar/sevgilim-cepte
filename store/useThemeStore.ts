// ====================================================================
// TEMA STORE (Zustand)
// ====================================================================
// Açık/koyu tema tercihini global olarak yönetir.
// NativeWind'in colorScheme API'si ile senkronize edilir; böylece hem
// className içindeki "dark:" varyantları hem de doğrudan kullandığımız
// renk paleti aynı anda güncellenir.
// ====================================================================

import { colorScheme } from "nativewind";
import { create } from "zustand";
import { getPalet, RenkPaleti } from "@/constants/theme";

export type TemaModu = "light" | "dark";

interface TemaState {
  mod: TemaModu;
  // Temayı belirli bir değere ayarlar
  temaAyarla: (mod: TemaModu) => void;
  // Açık <-> koyu arasında geçiş yapar
  temaDegistir: () => void;
}

export const useThemeStore = create<TemaState>((set, get) => ({
  mod: "light",

  temaAyarla: (mod) => {
    colorScheme.set(mod); // NativeWind'e bildir
    set({ mod });
  },

  temaDegistir: () => {
    const yeniMod: TemaModu = get().mod === "light" ? "dark" : "light";
    colorScheme.set(yeniMod);
    set({ mod: yeniMod });
  },
}));

// Aktif tema paletini (renkleri) döndüren pratik kısayol hook.
// Doğrudan renk değeri gereken yerlerde (gradyan, gölge, ikon rengi)
// className yerine bunu kullanırız.
export function usePalet(): RenkPaleti {
  const mod = useThemeStore((s) => s.mod);
  return getPalet(mod);
}
