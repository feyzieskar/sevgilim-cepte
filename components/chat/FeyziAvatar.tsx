// ====================================================================
// FeyziAvatar
// ====================================================================
// Feyzi'nin avatarı. ŞİMDİLİK placeholder: gradyan daire + kalp ikonu.
// İleride Feyzi'nin gerçek fotoğrafı (require/uri) ile değiştirilebilir.
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";

import { GRADIENTS } from "@/constants/theme";

interface FeyziAvatarProps {
  size?: number;
}

export function FeyziAvatar({ size = 40 }: FeyziAvatarProps) {
  return (
    <LinearGradient
      colors={GRADIENTS.romantik}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View>
        <Ionicons name="heart" size={size * 0.5} color="#FFFFFF" />
      </View>
    </LinearGradient>
  );
}
