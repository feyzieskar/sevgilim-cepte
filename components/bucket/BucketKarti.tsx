// ====================================================================
// BucketKarti — tek bir bucket list maddesi
// ====================================================================

import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";

import { kategoriBilgisi } from "@/data/bucketList";
import { tarihKisa } from "@/constants/tarih";
import { RADIUS, SHADOWS } from "@/constants/theme";
import { BucketItem } from "@/store/bucketListStore";
import { usePalet } from "@/store/useThemeStore";

interface BucketKartiProps {
  item: BucketItem;
  benimId?: string;
  onToggle: () => void;
  onDelete: () => void;
}

export function BucketKarti({ item, benimId, onToggle, onDelete }: BucketKartiProps) {
  const palet = usePalet();
  const kategori = kategoriBilgisi(item.category);
  const benim = item.createdBy === benimId;

  return (
    <View
      className="rounded-2xl p-4"
      style={{
        backgroundColor: item.isCompleted ? `${palet.secondary}12` : palet.yuzey,
        borderWidth: item.isCompleted ? 1 : 0,
        borderColor: `${palet.secondary}44`,
        ...SHADOWS.yumusak,
      }}
    >
      <View className="flex-row items-start">
        <Pressable
          onPress={onToggle}
          className="mr-3 mt-1 h-8 w-8 items-center justify-center rounded-full"
          style={{
            backgroundColor: item.isCompleted ? "#22C55E" : palet.yuzeyIkincil,
          }}
        >
          <Ionicons
            name={item.isCompleted ? "checkmark" : "ellipse-outline"}
            size={18}
            color={item.isCompleted ? "#FFFFFF" : palet.metinIkincil}
          />
        </Pressable>

        <View className="flex-1">
          <View className="flex-row items-center">
            <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
            <Text
              className="ml-2 flex-1 text-lg font-bold"
              style={{
                color: palet.metin,
                textDecorationLine: item.isCompleted ? "line-through" : "none",
                opacity: item.isCompleted ? 0.7 : 1,
              }}
            >
              {item.title}
            </Text>
          </View>

          {item.description ? (
            <Text className="mt-1" style={{ color: palet.metinIkincil }}>
              {item.description}
            </Text>
          ) : null}

          <View className="mt-2 flex-row flex-wrap items-center" style={{ gap: 8 }}>
            <View
              className="rounded-full px-2.5 py-1"
              style={{ backgroundColor: `${kategori.renk}22` }}
            >
              <Text className="text-xs font-semibold" style={{ color: kategori.renk }}>
                {kategori.etiket}
              </Text>
            </View>
            <Text className="text-xs" style={{ color: palet.metinIkincil }}>
              {benim ? "Sen ekledin" : "Partner ekledi"}
            </Text>
            {item.targetDate ? (
              <Text className="text-xs" style={{ color: palet.metinIkincil }}>
                🗓 {tarihKisa(item.targetDate)}
              </Text>
            ) : null}
          </View>

          {item.completedPhotoUrl ? (
            <Image
              source={{ uri: item.completedPhotoUrl }}
              className="mt-3 h-28 w-full rounded-xl"
              style={{ borderRadius: RADIUS.md }}
              resizeMode="cover"
            />
          ) : null}
        </View>

        <Pressable onPress={onDelete} hitSlop={10} className="ml-2 p-1">
          <Ionicons name="trash-outline" size={18} color={palet.metinIkincil} />
        </Pressable>
      </View>
    </View>
  );
}
