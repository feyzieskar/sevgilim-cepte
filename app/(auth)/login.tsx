// ====================================================================
// GİRİŞ / KAYIT EKRANI
// ====================================================================
// Tek ekranda hem giriş hem kayıt (alttaki bağlantı ile mod değişir).
// Sadece 2 kullanıcı (ben + sevgilim) için basit e-posta + şifre.
// Başarılı işlemde auth durumu güncellenir; route guard otomatik olarak
// tab navigasyona yönlendirir (bkz. app/_layout.tsx).
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Constants from "expo-constants";
import { GRADIENTS, RADIUS, SHADOWS } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import { usePalet } from "@/store/useThemeStore";

export default function LoginEkrani() {
  const palet = usePalet();
  const loading = useAuthStore((s) => s.loading);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);

  // Kayıt açma/kapama kontrolü (app.config.js / EXPO_PUBLIC_ALLOW_SIGNUP)
  const allowSignup =
    Constants.expoConfig?.extra?.allowSignup ?? process.env.EXPO_PUBLIC_ALLOW_SIGNUP === "true";

  // Mod: giriş mi kayıt mı?
  const [kayitMi, setKayitMi] = useState(false);
  const [ad, setAd] = useState("");
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");

  const gonder = async () => {
    if (email.trim() === "" || sifre === "") {
      Alert.alert("Eksik bilgi", "E-posta ve şifre gerekli.");
      return;
    }

    const sonuc = kayitMi ? await signUp(email, sifre, ad) : await signIn(email, sifre);

    if (!sonuc.basarili) {
      Alert.alert("Olmadı 💭", sonuc.hata ?? "Bir şeyler ters gitti.");
      return;
    }

    // Kayıt sonrası (e-posta onayı açıksa) bilgi ver
    if (kayitMi) {
      Alert.alert(
        "Hoş geldin 💕",
        "Kayıt alındı. E-posta onayı gerekiyorsa gelen kutunu kontrol et, sonra giriş yap."
      );
      setKayitMi(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palet.arkaplan }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 28 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / başlık */}
          <View className="mb-10 items-center">
            <LinearGradient
              colors={GRADIENTS.romantik}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
                alignItems: "center",
                justifyContent: "center",
                ...SHADOWS.kart,
              }}
            >
              <Text style={{ fontSize: 44 }}>💕</Text>
            </LinearGradient>
            <Text className="mt-5 text-3xl font-bold" style={{ color: palet.metin }}>
              Sevgilim Cepte
            </Text>
            <Text className="mt-2 text-center text-base" style={{ color: palet.metinIkincil }}>
              {kayitMi ? "Birlikte başlayalım 🌷" : "Tekrar hoş geldin 🤍"}
            </Text>
          </View>

          {/* Form */}
          <View className="gap-3">
            {kayitMi ? (
              <Girdi
                ikon="person-outline"
                placeholder="Görünen adın"
                value={ad}
                onChangeText={setAd}
                autoCapitalize="words"
              />
            ) : null}

            <Girdi
              ikon="mail-outline"
              placeholder="E-posta"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Girdi
              ikon="lock-closed-outline"
              placeholder="Şifre"
              value={sifre}
              onChangeText={setSifre}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {/* Gönder butonu */}
          <Pressable
            onPress={gonder}
            disabled={loading}
            style={{ marginTop: 24, borderRadius: RADIUS.lg, overflow: "hidden", ...SHADOWS.kart }}
          >
            <LinearGradient
              colors={GRADIENTS.romantik}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingVertical: 16, alignItems: "center" }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-lg font-bold text-white">
                  {kayitMi ? "Kayıt Ol" : "Giriş Yap"}
                </Text>
              )}
            </LinearGradient>
          </Pressable>

          {/* Mod değiştir (yalnızca kayıt açıksa gösterilir) */}
          {allowSignup ? (
            <Pressable
              onPress={() => setKayitMi((x) => !x)}
              className="mt-6 items-center"
              disabled={loading}
            >
              <Text style={{ color: palet.metinIkincil }}>
                {kayitMi ? "Zaten hesabın var mı? " : "Hesabın yok mu? "}
                <Text style={{ color: palet.primary, fontWeight: "700" }}>
                  {kayitMi ? "Giriş yap" : "Kayıt ol"}
                </Text>
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Tek satırlık ikonlu metin girişi ---
interface GirdiProps extends React.ComponentProps<typeof TextInput> {
  ikon: React.ComponentProps<typeof Ionicons>["name"];
}

function Girdi({ ikon, ...props }: GirdiProps) {
  const palet = usePalet();
  return (
    <View
      className="flex-row items-center px-4"
      style={{
        backgroundColor: palet.yuzey,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: palet.kenarlik,
        ...SHADOWS.yumusak,
      }}
    >
      <Ionicons name={ikon} size={20} color={palet.metinIkincil} />
      <TextInput
        placeholderTextColor={palet.metinIkincil}
        style={{ flex: 1, paddingVertical: 16, paddingLeft: 12, fontSize: 16, color: palet.metin }}
        {...props}
      />
    </View>
  );
}
