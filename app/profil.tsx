// ====================================================================
// PROFİL EKRANI  (placeholder — partner bilgileri ileride eklenecek)
// ====================================================================

import { User } from "lucide-react-native";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EkranBasligi } from "@/components/ui/EkranBasligi";
import { RADIUS, SHADOWS } from "@/constants/theme";
import { useAuthStore, useGoruntulenenAd } from "@/store/authStore";
import { usePalet } from "@/store/useThemeStore";

export default function ProfilEkrani() {
  const palet = usePalet();
  const ad = useGoruntulenenAd();
  const eposta = useAuthStore((s) => s.user?.email ?? "");

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: palet.arkaplan }}
    >
      <View className="px-5 pt-2">
        <EkranBasligi
          baslik="Profil"
          altBaslik="Sen ve partnerin 👤"
          geriDugmesi
        />
      </View>

      <View className="flex-1 px-5 pb-8 pt-4">
        <View
          className="items-center rounded-3xl p-6"
          style={{
            backgroundColor: palet.yuzey,
            borderRadius: RADIUS.lg,
            ...SHADOWS.yumusak,
          }}
        >
          <View
            className="h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: `${palet.primary}18` }}
          >
            <User size={38} color={palet.primary} strokeWidth={2.2} />
          </View>
          <Text
            className="mt-4 text-xl font-bold"
            style={{ color: palet.metin }}
          >
            {ad || "Sevgilim"}
          </Text>
          {eposta ? (
            <Text className="mt-1" style={{ color: palet.metinIkincil }}>
              {eposta}
            </Text>
          ) : null}
          <Text
            className="mt-5 text-center leading-6"
            style={{ color: palet.metinIkincil }}
          >
            Partner eşleştirme ve profil düzenleme özellikleri yakında burada
            olacak.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
