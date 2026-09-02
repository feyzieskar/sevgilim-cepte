// ====================================================================
// PROFİL EKRANI — hesap, partner ve güvenlik ayarları
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { Heart, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EkranBasligi } from "@/components/ui/EkranBasligi";
import { RADIUS, SHADOWS } from "@/constants/theme";
import { useAuthStore, useGoruntulenenAd } from "@/store/authStore";
import { useProfileStore } from "@/store/profileStore";
import { usePalet } from "@/store/useThemeStore";

export default function ProfilEkrani() {
  const palet = usePalet();
  const ad = useGoruntulenenAd();
  const eposta = useAuthStore((s) => s.user?.email ?? "");
  const authLoading = useAuthStore((s) => s.loading);
  const updateDisplayName = useAuthStore((s) => s.updateDisplayName);
  const changePassword = useAuthStore((s) => s.changePassword);

  const partnerProfil = useProfileStore((s) => s.partnerProfil);
  const loading = useProfileStore((s) => s.loading);
  const yuklendiMi = useProfileStore((s) => s.yuklendiMi);
  const fetchProfiller = useProfileStore((s) => s.fetchProfiller);
  const createPairingCode = useProfileStore((s) => s.createPairingCode);
  const redeemPairingCode = useProfileStore((s) => s.redeemPairingCode);

  const [gorunenAd, setGorunenAd] = useState(ad);
  const [yeniSifre, setYeniSifre] = useState("");
  const [sifreTekrar, setSifreTekrar] = useState("");
  const [uretilenKod, setUretilenKod] = useState<string | null>(null);
  const [girilenKod, setGirilenKod] = useState("");
  const [eslesmeYukleniyor, setEslesmeYukleniyor] = useState(false);

  useEffect(() => {
    if (!yuklendiMi) void fetchProfiller();
  }, [yuklendiMi, fetchProfiller]);

  const kodUret = async () => {
    setEslesmeYukleniyor(true);
    const res = await createPairingCode();
    setEslesmeYukleniyor(false);
    if (res.basarili && res.kod) {
      setUretilenKod(res.kod);
      Alert.alert(
        "Eşleşme Kodu 💕",
        `Kodun: ${res.kod}\n\nBu kodu partnerine ilet. Kod 15 dakika boyunca geçerlidir.`
      );
    } else {
      Alert.alert("Olmadı", res.hata ?? "Kod oluşturulamadı.");
    }
  };

  const kodEsle = async () => {
    if (girilenKod.trim().length !== 6) {
      Alert.alert("Eksik bilgi", "Lütfen 6 haneli eşleşme kodunu gir.");
      return;
    }
    setEslesmeYukleniyor(true);
    const res = await redeemPairingCode(girilenKod);
    setEslesmeYukleniyor(false);
    if (res.basarili) {
      setGirilenKod("");
      Alert.alert("Harika! 💕", "Partnerinle başarıyla eşleştiniz!");
    } else {
      Alert.alert("Eşleşme Başarısız", res.hata ?? "Kod doğrulanamadı.");
    }
  };

  useEffect(() => {
    setGorunenAd(ad);
  }, [ad]);

  const adKaydet = async () => {
    const sonuc = await updateDisplayName(gorunenAd);
    if (sonuc.basarili) {
      Alert.alert("Kaydedildi", "Görünen adın güncellendi.");
      void fetchProfiller();
    } else {
      Alert.alert("Olmadı", sonuc.hata ?? "Ad güncellenemedi.");
    }
  };

  const sifreDegistir = async () => {
    if (yeniSifre.length < 6) {
      Alert.alert("Eksik bilgi", "Yeni şifre en az 6 karakter olmalı.");
      return;
    }
    if (yeniSifre !== sifreTekrar) {
      Alert.alert("Eşleşmiyor", "Yeni şifreler birbiriyle aynı değil.");
      return;
    }

    const sonuc = await changePassword(yeniSifre);
    if (sonuc.basarili) {
      setYeniSifre("");
      setSifreTekrar("");
      Alert.alert("Tamam", "Şifren güncellendi.");
    } else {
      Alert.alert("Olmadı", sonuc.hata ?? "Şifre güncellenemedi.");
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: palet.arkaplan }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={loading && yuklendiMi}
            onRefresh={fetchProfiller}
            tintColor={palet.primary}
            colors={[palet.primary]}
          />
        }
      >
        <EkranBasligi baslik="Profil" altBaslik="Hesabın ve partnerin 👤" geriDugmesi />

        {/* Benim profilim */}
        <ProfilKarti baslik="Benim Profilim">
          <ProfilAvatar ikon={User} />
          <Text className="mt-3 text-sm font-semibold" style={{ color: palet.metinIkincil }}>
            Görünen ad
          </Text>
          <TextInput
            value={gorunenAd}
            onChangeText={setGorunenAd}
            placeholder="Adın"
            placeholderTextColor={palet.metinIkincil}
            style={inputStil(palet)}
          />
          <Text className="mt-3 text-sm font-semibold" style={{ color: palet.metinIkincil }}>
            E-posta
          </Text>
          <View
            className="mt-1 rounded-xl px-4 py-3"
            style={{ backgroundColor: palet.yuzeyIkincil }}
          >
            <Text style={{ color: palet.metin }}>{eposta || "—"}</Text>
          </View>
          <KaydetDugmesi
            etiket="Adı Kaydet"
            yukleniyor={authLoading}
            onPress={adKaydet}
            disabled={gorunenAd.trim() === ""}
          />
        </ProfilKarti>

        {/* Partner */}
        <ProfilKarti baslik="Partnerim">
          {loading && !yuklendiMi ? (
            <ActivityIndicator color={palet.primary} />
          ) : partnerProfil ? (
            <>
              <ProfilAvatar ikon={Heart} vurgu />
              <Text className="mt-4 text-xl font-bold" style={{ color: palet.metin }}>
                {partnerProfil.displayName}
              </Text>
              <View
                className="mt-3 flex-row items-center rounded-full px-3 py-1.5"
                style={{ backgroundColor: "#22C55E22" }}
              >
                <Ionicons name="heart" size={14} color="#22C55E" />
                <Text className="ml-1.5 text-sm font-semibold" style={{ color: "#22C55E" }}>
                  Eşleşmiş 💕
                </Text>
              </View>
              <Text className="mt-4 text-center leading-6" style={{ color: palet.metinIkincil }}>
                Birlikte anılar, streak, ruh hali ve daha fazlasını paylaşıyorsunuz.
              </Text>
            </>
          ) : (
            <View className="items-center py-2">
              <ProfilAvatar ikon={Heart} soluk />
              <Text className="mt-4 text-center font-semibold" style={{ color: palet.metin }}>
                Henüz partner eşleşmesi yok
              </Text>
              <Text className="mt-2 text-center leading-6" style={{ color: palet.metinIkincil }}>
                Partnerinle güvenli bir şekilde eşleşmek için kod oluştur veya partnerinin kodunu
                gir.
              </Text>

              {/* Kod Oluştur */}
              {uretilenKod ? (
                <View
                  className="mt-4 w-full items-center rounded-xl p-4"
                  style={{
                    backgroundColor: `${palet.primary}15`,
                    borderWidth: 1,
                    borderColor: `${palet.primary}40`,
                  }}
                >
                  <Text style={{ color: palet.metinIkincil, fontSize: 13 }}>
                    Partnerine bu kodu ilet (15 dk geçerli):
                  </Text>
                  <Text
                    className="mt-2 text-3xl font-extrabold tracking-widest"
                    style={{ color: palet.primary }}
                  >
                    {uretilenKod}
                  </Text>
                </View>
              ) : (
                <View className="mt-4 w-full">
                  <KaydetDugmesi
                    etiket="Eşleşme Kodu Oluştur 🔐"
                    yukleniyor={eslesmeYukleniyor}
                    onPress={kodUret}
                    disabled={eslesmeYukleniyor}
                  />
                </View>
              )}

              {/* Ayraç */}
              <View className="my-4 w-full flex-row items-center">
                <View className="h-px flex-1" style={{ backgroundColor: palet.kenarlik }} />
                <Text className="mx-3 text-xs" style={{ color: palet.metinIkincil }}>
                  veya kodu gir
                </Text>
                <View className="h-px flex-1" style={{ backgroundColor: palet.kenarlik }} />
              </View>

              {/* Kod Gir */}
              <View className="w-full flex-row items-center gap-2">
                <TextInput
                  value={girilenKod}
                  onChangeText={(t) => setGirilenKod(t.replace(/[^0-9]/g, "").slice(0, 6))}
                  placeholder="6 haneli kod"
                  placeholderTextColor={palet.metinIkincil}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={[
                    inputStil(palet),
                    { flex: 1, textAlign: "center", fontSize: 18, letterSpacing: 4 },
                  ]}
                />
                <Pressable
                  onPress={kodEsle}
                  disabled={girilenKod.length !== 6 || eslesmeYukleniyor}
                  style={{
                    backgroundColor: girilenKod.length === 6 ? palet.primary : palet.kenarlik,
                    borderRadius: RADIUS.md,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Eşleş</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ProfilKarti>

        {/* Şifre */}
        <ProfilKarti baslik="Güvenlik">
          <Text className="text-sm font-semibold" style={{ color: palet.metinIkincil }}>
            Yeni şifre
          </Text>
          <TextInput
            value={yeniSifre}
            onChangeText={setYeniSifre}
            placeholder="En az 6 karakter"
            placeholderTextColor={palet.metinIkincil}
            secureTextEntry
            autoCapitalize="none"
            style={inputStil(palet)}
          />
          <Text className="mt-3 text-sm font-semibold" style={{ color: palet.metinIkincil }}>
            Yeni şifre (tekrar)
          </Text>
          <TextInput
            value={sifreTekrar}
            onChangeText={setSifreTekrar}
            placeholder="Şifreyi tekrar yaz"
            placeholderTextColor={palet.metinIkincil}
            secureTextEntry
            autoCapitalize="none"
            style={inputStil(palet)}
          />
          <KaydetDugmesi
            etiket="Şifreyi Güncelle"
            yukleniyor={authLoading}
            onPress={sifreDegistir}
            disabled={yeniSifre === "" || sifreTekrar === ""}
          />
        </ProfilKarti>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfilKarti({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  const palet = usePalet();

  return (
    <View
      className="mt-4 items-center rounded-2xl p-5"
      style={{
        backgroundColor: palet.yuzey,
        borderRadius: RADIUS.lg,
        ...SHADOWS.yumusak,
      }}
    >
      <Text className="mb-4 self-start text-lg font-bold" style={{ color: palet.metin }}>
        {baslik}
      </Text>
      <View className="w-full items-center">{children}</View>
    </View>
  );
}

function ProfilAvatar({
  ikon: Ikon,
  vurgu,
  soluk,
}: {
  ikon: typeof User;
  vurgu?: boolean;
  soluk?: boolean;
}) {
  const palet = usePalet();
  const renk = vurgu ? "#E14D80" : palet.primary;
  const arkaplan = soluk ? `${palet.metinIkincil}18` : `${renk}18`;

  return (
    <View
      className="h-20 w-20 items-center justify-center rounded-full"
      style={{ backgroundColor: arkaplan }}
    >
      <Ikon size={38} color={soluk ? palet.metinIkincil : renk} strokeWidth={2.2} />
    </View>
  );
}

function KaydetDugmesi({
  etiket,
  yukleniyor,
  onPress,
  disabled,
}: {
  etiket: string;
  yukleniyor: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  const palet = usePalet();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || yukleniyor}
      className="mt-4 w-full items-center rounded-xl py-3.5"
      style={{
        backgroundColor: disabled ? palet.kenarlik : palet.primary,
        opacity: yukleniyor ? 0.8 : 1,
      }}
    >
      {yukleniyor ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text className="font-bold text-white">{etiket}</Text>
      )}
    </Pressable>
  );
}

function inputStil(palet: ReturnType<typeof usePalet>) {
  return {
    marginTop: 6,
    backgroundColor: palet.yuzeyIkincil,
    borderRadius: RADIUS.md,
    color: palet.metin,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    width: "100%" as const,
  };
}
