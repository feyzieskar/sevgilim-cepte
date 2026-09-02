// ====================================================================
// MENÜ SEKMESİ
// ====================================================================
// İkincil özellikler ve ayarlar burada listelenir.
// Özellikler stack route'lara gider; tema ve çıkış doğrudan menüde yapılır.
// ====================================================================

import { Href, useRouter } from "expo-router";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react-native";
import {
  Camera,
  ChevronRight,
  Heart,
  ListChecks,
  LogOut,
  Moon,
  Rainbow,
  Smile,
  Sparkles,
  User,
} from "lucide-react-native";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EkranBasligi } from "@/components/ui/EkranBasligi";
import { RADIUS, SHADOWS } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import { usePalet, useThemeStore } from "@/store/useThemeStore";

type MenuOgesi = {
  id: string;
  ikon: LucideIcon;
  baslik: string;
  aciklama: string;
  hedef: Href;
};

const OZELLIKLER: MenuOgesi[] = [
  {
    id: "anilar",
    ikon: Camera,
    baslik: "Anılar",
    aciklama: "Fotoğraflar, zaman tüneli ve anı detayları",
    hedef: "/anilar",
  },
  {
    id: "duygular",
    ikon: Smile,
    baslik: "Duygular",
    aciklama: "Acıktım, sevgi saati ve sürprizler",
    hedef: "/duygular",
  },
  {
    id: "ruh-hali",
    ikon: Rainbow,
    baslik: "Ruh Hali",
    aciklama: "Bugün nasıl hissediyorsun?",
    hedef: "/ruh-hali",
  },
  {
    id: "bucket-list",
    ikon: ListChecks,
    baslik: "Bucket List",
    aciklama: "Birlikte yapılacaklar listesi",
    hedef: "/bucket-list",
  },
  {
    id: "sevme-sebepleri",
    ikon: Heart,
    baslik: "Sevme Sebepleri",
    aciklama: "Seni neden seviyorum?",
    hedef: "/sevme-sebepleri",
  },
];

const AYARLAR: MenuOgesi[] = [
  {
    id: "profil",
    ikon: User,
    baslik: "Profil / Partner",
    aciklama: "Hesap ve partner bilgileri",
    hedef: "/profil",
  },
];

function MenuBolumu({
  baslik,
  altBaslik,
  ikon: BolumIkon,
  children,
}: {
  baslik: string;
  altBaslik?: string;
  ikon: LucideIcon;
  children: ReactNode;
}) {
  const palet = usePalet();

  return (
    <View
      className="rounded-3xl p-5"
      style={{
        backgroundColor: palet.yuzey,
        borderRadius: RADIUS.lg,
        ...SHADOWS.yumusak,
      }}
    >
      <View className="flex-row items-center">
        <View
          className="h-12 w-12 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${palet.primary}16` }}
        >
          <BolumIkon size={24} color={palet.primary} strokeWidth={2.2} />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-lg font-bold" style={{ color: palet.metin }}>
            {baslik}
          </Text>
          {altBaslik ? (
            <Text className="mt-1" style={{ color: palet.metinIkincil }}>
              {altBaslik}
            </Text>
          ) : null}
        </View>
      </View>
      <View className="mt-5" style={{ gap: 12 }}>
        {children}
      </View>
    </View>
  );
}

function MenuSatiri({
  ikon: Ikon,
  baslik,
  aciklama,
  onPress,
  sagEtiket,
  tehlikeli,
}: {
  ikon: LucideIcon;
  baslik: string;
  aciklama: string;
  onPress: () => void;
  sagEtiket?: string;
  tehlikeli?: boolean;
}) {
  const palet = usePalet();
  const vurguRengi = tehlikeli ? "#E14D80" : palet.primary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        opacity: pressed ? 0.85 : 1,
        backgroundColor: palet.yuzeyIkincil,
        borderRadius: RADIUS.md,
        padding: 16,
      })}
    >
      <View pointerEvents="none" className="flex-row items-center">
        <View
          className="h-11 w-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${vurguRengi}14` }}
        >
          <Ikon size={21} color={vurguRengi} strokeWidth={2.2} />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-base font-semibold" style={{ color: palet.metin }}>
            {baslik}
          </Text>
          <Text className="mt-1 text-sm" style={{ color: palet.metinIkincil }}>
            {aciklama}
          </Text>
        </View>
        {sagEtiket ? (
          <Text className="mr-1 text-sm font-semibold" style={{ color: palet.metinIkincil }}>
            {sagEtiket}
          </Text>
        ) : (
          <ChevronRight size={20} color={palet.metinIkincil} strokeWidth={2.2} />
        )}
      </View>
    </Pressable>
  );
}

export default function MenuEkrani() {
  const palet = usePalet();
  const router = useRouter();
  const mod = useThemeStore((s) => s.mod);
  const temaDegistir = useThemeStore((s) => s.temaDegistir);
  const signOut = useAuthStore((s) => s.signOut);

  const cikisYap = () => {
    Alert.alert("Çıkış yap", "Oturumu kapatmak istediğine emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Çıkış yap", style: "destructive", onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: palet.arkaplan }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <EkranBasligi baslik="Menü" altBaslik="Tüm özellikler ve ayarlar burada ☰" />

        <MenuBolumu
          baslik="Özellikler"
          altBaslik="Anılar, duygular ve daha fazlası"
          ikon={Sparkles}
        >
          {OZELLIKLER.map((oge) => (
            <MenuSatiri
              key={oge.id}
              ikon={oge.ikon}
              baslik={oge.baslik}
              aciklama={oge.aciklama}
              onPress={() => router.push(oge.hedef)}
            />
          ))}
        </MenuBolumu>

        <MenuBolumu baslik="Ayarlar" ikon={User}>
          {AYARLAR.map((oge) => (
            <MenuSatiri
              key={oge.id}
              ikon={oge.ikon}
              baslik={oge.baslik}
              aciklama={oge.aciklama}
              onPress={() => router.push(oge.hedef)}
            />
          ))}
          <MenuSatiri
            ikon={Moon}
            baslik="Tema"
            aciklama="Gündüz ve gece modu arasında geçiş"
            sagEtiket={mod === "dark" ? "Gece" : "Gündüz"}
            onPress={temaDegistir}
          />
          <MenuSatiri
            ikon={LogOut}
            baslik="Çıkış Yap"
            aciklama="Oturumu güvenle kapat"
            onPress={cikisYap}
            tehlikeli
          />
        </MenuBolumu>
      </ScrollView>
    </SafeAreaView>
  );
}
