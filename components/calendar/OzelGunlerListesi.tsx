// ====================================================================
// OzelGunlerListesi
// ====================================================================
// "Bize Özel Günler" görünümü. Her yıl tekrar eden özel günleri
// (Supabase special_days, partnerle ortak) listeler; her biri için
// "kaç gün kaldı" bilgisini gösterir ve yakına göre sıralar.
// Bir güne dokununca düzenlenir; (+) ile yenisi eklenir.
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { OzelGunFormModal } from "@/components/calendar/OzelGunFormModal";
import { KATEGORILER } from "@/constants/kategoriler";
import { AYLAR } from "@/constants/tarih";
import { RADIUS, SHADOWS } from "@/constants/theme";
import {
  enYakinOzelGun,
  kalanGun,
  OzelGun,
  sonrakiTarih,
} from "@/data/ozelGunler";
import { OzelGunGirdi, useOzelGunStore } from "@/store/ozelGunStore";
import { usePalet } from "@/store/useThemeStore";

// Ekranda gösterilecek öğe
interface OzelGunOgesi {
  gun: OzelGun;
  kalan: number;
  tarihMetni: string;
}

export function OzelGunlerListesi() {
  const palet = usePalet();
  const ozelRenk = KATEGORILER.ozel_gun.renk;

  const ozelGunler = useOzelGunStore((s) => s.ozelGunler);
  const addOzelGun = useOzelGunStore((s) => s.addOzelGun);
  const updateOzelGun = useOzelGunStore((s) => s.updateOzelGun);
  const deleteOzelGun = useOzelGunStore((s) => s.deleteOzelGun);
  const loading = useOzelGunStore((s) => s.loading);
  const yuklendiMi = useOzelGunStore((s) => s.yuklendiMi);

  const [modalAcik, setModalAcik] = useState(false);
  const [duzenlenen, setDuzenlenen] = useState<OzelGun | null>(null);

  const ogeler = useMemo<OzelGunOgesi[]>(() => {
    const bugun = new Date();
    return ozelGunler
      .map((g) => {
        const tarih = sonrakiTarih(g, bugun);
        return {
          gun: g,
          kalan: kalanGun(tarih, bugun),
          tarihMetni: `${g.gun} ${AYLAR[g.ay - 1]}`,
        };
      })
      .sort((a, b) => a.kalan - b.kalan);
  }, [ozelGunler]);

  const enYakin = useMemo(() => enYakinOzelGun(ozelGunler), [ozelGunler]);

  const yeniEkle = () => {
    setDuzenlenen(null);
    setModalAcik(true);
  };

  const duzenle = (g: OzelGun) => {
    setDuzenlenen(g);
    setModalAcik(true);
  };

  const kaydet = async (veri: OzelGunGirdi) => {
    if (duzenlenen) {
      await updateOzelGun(duzenlenen.id, veri);
    } else {
      await addOzelGun(veri);
    }
    setModalAcik(false);
    setDuzenlenen(null);
  };

  const sil = async (id: string) => {
    await deleteOzelGun(id);
    setModalAcik(false);
    setDuzenlenen(null);
  };

  return (
    <View className="gap-3">
      {/* Yeni özel gün ekleme butonu */}
      <Pressable
        onPress={yeniEkle}
        className="flex-row items-center justify-center rounded-2xl py-3"
        style={{ backgroundColor: ozelRenk + "22", borderWidth: 1, borderColor: ozelRenk }}
      >
        <Ionicons name="add-circle" size={20} color={ozelRenk} />
        <Text className="ml-2 font-bold" style={{ color: ozelRenk }}>
          Yeni Özel Gün Ekle
        </Text>
      </Pressable>

      {/* İlk yükleme göstergesi */}
      {!yuklendiMi && loading ? (
        <View className="items-center py-6">
          <ActivityIndicator color={palet.primary} />
        </View>
      ) : null}

      {ogeler.map((o) => {
        const vurgu = enYakin && o.gun.id === enYakin.gun.id;
        return (
          <Pressable
            key={o.gun.id}
            onPress={() => duzenle(o.gun)}
            className="flex-row items-center p-4"
            style={{
              backgroundColor: palet.yuzey,
              borderRadius: RADIUS.md,
              borderWidth: vurgu ? 2 : 0,
              borderColor: ozelRenk,
              ...SHADOWS.yumusak,
            }}
          >
            {/* Emoji rozeti */}
            <View
              className="mr-3 h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: ozelRenk + "22" }}
            >
              <Text className="text-xl">{o.gun.emoji}</Text>
            </View>

            {/* Başlık + tarih */}
            <View className="flex-1">
              <Text className="text-base font-bold" style={{ color: palet.metin }}>
                {o.gun.baslik}
              </Text>
              <View className="mt-0.5 flex-row items-center">
                <Ionicons name="calendar-outline" size={13} color={palet.metinIkincil} />
                <Text className="ml-1 text-xs" style={{ color: palet.metinIkincil }}>
                  {o.tarihMetni} · her yıl
                </Text>
              </View>
            </View>

            {/* Geri sayım */}
            <View className="items-end">
              <Text className="text-2xl font-extrabold" style={{ color: ozelRenk }}>
                {o.kalan === 0 ? "Bugün" : o.kalan}
              </Text>
              {o.kalan > 0 ? (
                <Text className="text-xs" style={{ color: palet.metinIkincil }}>
                  gün kaldı
                </Text>
              ) : (
                <Text className="text-xs" style={{ color: ozelRenk }}>
                  🎉
                </Text>
              )}
            </View>
          </Pressable>
        );
      })}

      {yuklendiMi && ogeler.length === 0 ? (
        <Text className="mt-8 text-center" style={{ color: palet.metinIkincil }}>
          Henüz özel gün yok. Yukarıdaki "Yeni Özel Gün Ekle" ile
          yıldönümünüzü, doğum günlerinizi ekleyin 💜
        </Text>
      ) : null}

      {/* Ekle / Düzenle modalı */}
      <OzelGunFormModal
        visible={modalAcik}
        onClose={() => {
          setModalAcik(false);
          setDuzenlenen(null);
        }}
        duzenlenen={duzenlenen}
        onKaydet={kaydet}
        onSil={sil}
      />
    </View>
  );
}
