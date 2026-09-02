// ====================================================================
// PROFİL STORE — partner profil bilgisi
// ====================================================================

import { create } from "zustand";

import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

export interface KullaniciProfil {
  id: string;
  displayName: string;
  avatarUrl?: string;
  partnerId?: string;
}

interface ProfilRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  partner_id: string | null;
}

interface ProfileState {
  benimProfil: KullaniciProfil | null;
  partnerProfil: KullaniciProfil | null;
  loading: boolean;
  yuklendiMi: boolean;

  fetchProfiller: () => Promise<void>;
  createPairingCode: () => Promise<{ basarili: boolean; kod?: string; hata?: string }>;
  redeemPairingCode: (kod: string) => Promise<{ basarili: boolean; hata?: string }>;
}

function satiriProfilCevir(r: ProfilRow): KullaniciProfil {
  const ad = r.display_name?.trim();
  return {
    id: r.id,
    displayName: ad && ad.length > 0 ? ad : "Sevgilim",
    avatarUrl: r.avatar_url ?? undefined,
    partnerId: r.partner_id ?? undefined,
  };
}

async function partnerIdBul(userId: string): Promise<string | null> {
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

export const useProfileStore = create<ProfileState>((set) => ({
  benimProfil: null,
  partnerProfil: null,
  loading: false,
  yuklendiMi: false,

  fetchProfiller: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      set({ benimProfil: null, partnerProfil: null, yuklendiMi: true });
      return;
    }

    set({ loading: true });

    const { data: benim, error: benimHata } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, partner_id")
      .eq("id", userId)
      .maybeSingle();

    if (benimHata) {
      console.warn("[profileStore] benim profil hatası:", benimHata.message);
      set({ loading: false, yuklendiMi: true });
      return;
    }

    const partnerId = (benim as ProfilRow | null)?.partner_id ?? (await partnerIdBul(userId));

    let partnerProfil: KullaniciProfil | null = null;
    if (partnerId) {
      const { data: partner, error: partnerHata } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, partner_id")
        .eq("id", partnerId)
        .maybeSingle();

      if (partnerHata) {
        console.warn("[profileStore] partner profil hatası:", partnerHata.message);
      } else if (partner) {
        partnerProfil = satiriProfilCevir(partner as ProfilRow);
      }
    }

    set({
      benimProfil: benim ? satiriProfilCevir(benim as ProfilRow) : null,
      partnerProfil,
      loading: false,
      yuklendiMi: true,
    });
  },

  createPairingCode: async () => {
    try {
      const { data, error } = await supabase.rpc("create_pairing_code");
      if (error) {
        return { basarili: false, hata: error.message };
      }
      return { basarili: true, kod: data as string };
    } catch (e) {
      return {
        basarili: false,
        hata: e instanceof Error ? e.message : "Eşleşme kodu oluşturulamadı.",
      };
    }
  },

  redeemPairingCode: async (kod: string) => {
    try {
      const { data, error } = await supabase.rpc("redeem_pairing_code", {
        p_code: kod.trim(),
      });
      if (error) {
        return { basarili: false, hata: error.message };
      }
      const sonuc = data as { ok: boolean; error?: string; partner_id?: string };
      if (!sonuc.ok) {
        return { basarili: false, hata: sonuc.error ?? "Kod geçersiz veya süresi dolmuş." };
      }
      // Eşleşme başarılı, profilleri yenile
      await useProfileStore.getState().fetchProfiller();
      return { basarili: true };
    } catch (e) {
      return {
        basarili: false,
        hata: e instanceof Error ? e.message : "Kod doğrulanamadı.",
      };
    }
  },
}));
