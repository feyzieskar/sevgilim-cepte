// ====================================================================
// BUGÜN BİZ  (Ana Ekran)
// ====================================================================
// Dikey kaydırılabilir kart listesi:
//   1) Bugünkü Etkinlik
//   2) Sonraki Özel Gün (geri sayım)
//   3) Günün Mesajı
//   4) Feyzi AI'a Sor
//   5) Bugün Seni Sevme Sebebim
// Tüm kartlar şimdilik statik/mock veriyle çalışır.
// ====================================================================

import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EtkinlikKarti } from "@/components/cards/EtkinlikKarti";
import { FeyziAiKarti } from "@/components/cards/FeyziAiKarti";
import { GununMesajiKarti } from "@/components/cards/GununMesajiKarti";
import { OzelGunKarti } from "@/components/cards/OzelGunKarti";
import { SevmeSebebiKarti } from "@/components/cards/SevmeSebebiKarti";
import { EkranBasligi } from "@/components/ui/EkranBasligi";
import { usePalet } from "@/store/useThemeStore";

export default function AnaEkran() {
  const palet = usePalet();

  // Selamlama metnini saate göre belirle
  const saat = new Date().getHours();
  const selam =
    saat < 6
      ? "İyi geceler 🌙"
      : saat < 12
        ? "Günaydın aşkım ☀️"
        : saat < 18
          ? "İyi günler 🌸"
          : "İyi akşamlar 🌆";

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: palet.arkaplan }}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <EkranBasligi baslik="Bugün Biz" altBaslik={selam} temaDugmesi cikisDugmesi />

        {/* Kartlar arası boşluk için her birini View ile sarıyoruz */}
        <View className="mt-4 gap-4">
          <EtkinlikKarti />
          <OzelGunKarti />
          <GununMesajiKarti />
          <FeyziAiKarti />
          <SevmeSebebiKarti />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
