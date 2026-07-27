// ====================================================================
// MENÜ SEKMESİ
// ====================================================================
// İkincil özellikler burada listelenir. Tam liste 3. adımda tamamlanır;
// şimdilik Anılar ve Duygular stack route'lara yönlendirilir.
// ====================================================================

import { useRouter } from "expo-router";
import {
  ChevronRight,
  Heart,
  Menu as MenuIcon,
  Sparkles,
} from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EkranBasligi } from "@/components/ui/EkranBasligi";
import { RADIUS, SHADOWS } from "@/constants/theme";
import { usePalet } from "@/store/useThemeStore";

const GECICI_MENU = [
  {
    id: "anilar",
    ikon: Heart,
    baslik: "Anılar",
    aciklama: "Fotoğraflar, zaman tüneli ve anı detayları",
    hedef: "/anilar" as const,
  },
  {
    id: "duygular",
    ikon: Sparkles,
    baslik: "Duygular",
    aciklama: "Acıktım, sevgi saati ve sürprizler",
    hedef: "/duygular" as const,
  },
];

export default function MenuEkrani() {
  const palet = usePalet();
  const router = useRouter();

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: palet.arkaplan }}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <EkranBasligi
          baslik="Menü"
          altBaslik="Diğer güzel özellikleri burada topluyoruz ☰"
        />

        <View
          className="mt-4 rounded-3xl p-5"
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
              <MenuIcon size={24} color={palet.primary} strokeWidth={2.2} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-lg font-bold" style={{ color: palet.metin }}>
                Özellikler
              </Text>
              <Text className="mt-1" style={{ color: palet.metinIkincil }}>
                Sonraki adımda Ruh Hali, Bucket List ve ayarlar eklenecek.
              </Text>
            </View>
          </View>

          <View className="mt-5 gap-3">
            {GECICI_MENU.map((oge) => {
              const Ikon = oge.ikon;
              return (
                <Pressable
                  key={oge.id}
                  onPress={() => router.push(oge.hedef)}
                  className="flex-row items-center rounded-2xl p-4"
                  style={{ backgroundColor: palet.yuzeyIkincil }}
                >
                  <View
                    className="h-11 w-11 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${palet.primary}14` }}
                  >
                    <Ikon size={21} color={palet.primary} strokeWidth={2.2} />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text
                      className="text-base font-semibold"
                      style={{ color: palet.metin }}
                    >
                      {oge.baslik}
                    </Text>
                    <Text
                      className="mt-1 text-sm"
                      style={{ color: palet.metinIkincil }}
                    >
                      {oge.aciklama}
                    </Text>
                  </View>
                  <ChevronRight
                    size={20}
                    color={palet.metinIkincil}
                    strokeWidth={2.2}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
