// ====================================================================
// GradientCard
// ====================================================================
// Uygulamanın her yerinde kullanılan yuvarlak köşeli, gölgeli kart.
// İki modu vardır:
//  - gradient={true}  -> arka planı romantik gradyan ile doldurur
//  - gradient={false} -> tema yüzey rengini kullanır (düz kart)
// Tıklanabilir yapmak için onPress verilebilir.
// ====================================================================

import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { Pressable, View, ViewStyle } from "react-native";

import { GRADIENTS, RADIUS, SHADOWS } from "@/constants/theme";
import { usePalet } from "@/store/useThemeStore";

interface GradientCardProps {
  children: ReactNode;
  // Gradyan dolgu kullanılsın mı?
  gradient?: boolean;
  // Hangi gradyan? (varsayılan: romantik)
  gradientTipi?: keyof typeof GRADIENTS;
  // Tıklanınca çalışacak fonksiyon (verilirse kart basılabilir olur)
  onPress?: () => void;
  // Ek stil
  style?: ViewStyle;
}

export function GradientCard({
  children,
  gradient = false,
  gradientTipi = "romantik",
  onPress,
  style,
}: GradientCardProps) {
  const palet = usePalet();

  const icerik = (
    <View
      className="p-5"
      style={{ borderRadius: RADIUS.lg, overflow: "hidden" }}
    >
      {children}
    </View>
  );

  // Tüm kartlarda ortak olan dış sarmalayıcı stili
  const disStil: ViewStyle = {
    borderRadius: RADIUS.lg,
    ...SHADOWS.kart,
    ...style,
  };

  const govde = gradient ? (
    <LinearGradient
      colors={GRADIENTS[gradientTipi]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: RADIUS.lg }}
    >
      {icerik}
    </LinearGradient>
  ) : (
    <View style={{ borderRadius: RADIUS.lg, backgroundColor: palet.yuzey }}>
      {icerik}
    </View>
  );

  // onPress varsa basılabilir sarmalayıcı, yoksa düz View
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [disStil, { opacity: pressed ? 0.9 : 1 }]}
      >
        {govde}
      </Pressable>
    );
  }

  return <View style={disStil}>{govde}</View>;
}
