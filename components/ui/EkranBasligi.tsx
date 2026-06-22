// ====================================================================
// EkranBasligi
// ====================================================================
// Her sekmenin üstünde gösterilen başlık + alt başlık bileşeni.
// Sağ tarafta tema değiştirme (gündüz/gece) düğmesi opsiyoneldir.
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, Text, View } from "react-native";

import { useAuthStore } from "@/store/authStore";
import { usePalet, useThemeStore } from "@/store/useThemeStore";

interface EkranBasligiProps {
  baslik: string;
  altBaslik?: string;
  // Tema değiştirme düğmesi gösterilsin mi? (genelde ana ekranda)
  temaDugmesi?: boolean;
  // Çıkış (oturum kapat) düğmesi gösterilsin mi?
  cikisDugmesi?: boolean;
}

export function EkranBasligi({
  baslik,
  altBaslik,
  temaDugmesi = false,
  cikisDugmesi = false,
}: EkranBasligiProps) {
  const palet = usePalet();
  const mod = useThemeStore((s) => s.mod);
  const temaDegistir = useThemeStore((s) => s.temaDegistir);
  const signOut = useAuthStore((s) => s.signOut);

  // Onaylı çıkış (yanlışlıkla basmayı önler)
  const cikisYap = () => {
    Alert.alert("Çıkış yap", "Oturumu kapatmak istediğine emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Çıkış yap", style: "destructive", onPress: () => signOut() },
    ]);
  };

  return (
    <View className="mb-2 flex-row items-center justify-between px-1">
      <View className="flex-1 pr-3">
        <Text
          className="text-3xl font-bold"
          style={{ color: palet.metin }}
        >
          {baslik}
        </Text>
        {altBaslik ? (
          <Text
            className="mt-1 text-base"
            style={{ color: palet.metinIkincil }}
          >
            {altBaslik}
          </Text>
        ) : null}
      </View>

      <View className="flex-row items-center gap-2">
        {temaDugmesi ? (
          <Pressable
            onPress={temaDegistir}
            className="h-11 w-11 items-center justify-center rounded-full"
            style={{ backgroundColor: palet.yuzeyIkincil }}
          >
            <Ionicons
              name={mod === "dark" ? "sunny" : "moon"}
              size={22}
              color={palet.primary}
            />
          </Pressable>
        ) : null}

        {cikisDugmesi ? (
          <Pressable
            onPress={cikisYap}
            className="h-11 w-11 items-center justify-center rounded-full"
            style={{ backgroundColor: palet.yuzeyIkincil }}
          >
            <Ionicons name="log-out-outline" size={22} color={palet.primary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
