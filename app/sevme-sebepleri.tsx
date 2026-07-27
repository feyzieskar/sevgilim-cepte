import { Heart } from "lucide-react-native";

import { YakindaEkrani } from "@/components/ui/YakindaEkrani";

export default function SevmeSebepleriEkrani() {
  return (
    <YakindaEkrani
      baslik="Sevme Sebepleri"
      altBaslik="Seni neden seviyorum? 💝"
      ikon={Heart}
      mesaj="Özel sevme sebeplerinizi yönetebileceğiniz tam ekran deneyim yakında burada olacak. Şimdilik ana ekrandaki karttan ekleyebilirsin."
    />
  );
}
