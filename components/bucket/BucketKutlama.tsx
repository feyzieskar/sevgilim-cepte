// ====================================================================
// BucketKutlama — tamamlanınca kutlama overlay'i
// ====================================================================

import { useEffect } from "react";
import { Modal, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { RADIUS } from "@/constants/theme";
import { usePalet } from "@/store/useThemeStore";

interface BucketKutlamaProps {
  visible: boolean;
  baslik: string;
  onKapat: () => void;
}

export function BucketKutlama({ visible, baslik, onKapat }: BucketKutlamaProps) {
  const palet = usePalet();
  const olcek = useSharedValue(0.8);

  useEffect(() => {
    if (!visible) return;
    olcek.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 400 }),
        withTiming(1, { duration: 400 })
      ),
      3,
      true
    );
    const zamanlayici = setTimeout(onKapat, 2800);
    return () => clearTimeout(zamanlayici);
  }, [visible, olcek, onKapat]);

  const animStil = useAnimatedStyle(() => ({
    transform: [{ scale: olcek.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        className="flex-1 items-center justify-center px-8"
        style={{ backgroundColor: "#00000055" }}
      >
        <Animated.View
          style={[
            animStil,
            {
              backgroundColor: palet.yuzey,
              borderRadius: RADIUS.lg,
              padding: 28,
              alignItems: "center",
              width: "100%",
            },
          ]}
        >
          <Text style={{ fontSize: 48 }}>🎉✨🎊</Text>
          <Text
            className="mt-4 text-center text-2xl font-bold"
            style={{ color: palet.metin }}
          >
            Hayal Gerçekleşti!
          </Text>
          <Text
            className="mt-2 text-center text-base"
            style={{ color: palet.metinIkincil }}
          >
            {baslik}
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}
