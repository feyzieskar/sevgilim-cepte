import { Rainbow } from "lucide-react-native";

import { YakindaEkrani } from "@/components/ui/YakindaEkrani";

export default function RuhHaliEkrani() {
  return (
    <YakindaEkrani
      baslik="Ruh Hali"
      altBaslik="Bugün nasıl hissediyorsun? 🌈"
      ikon={Rainbow}
      mesaj="Günlük ruh halinizi partnerinizle paylaşabileceğiniz bu özellik çok yakında hazır olacak."
    />
  );
}
