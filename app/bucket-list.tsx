import { Sparkles } from "lucide-react-native";

import { YakindaEkrani } from "@/components/ui/YakindaEkrani";

export default function BucketListEkrani() {
  return (
    <YakindaEkrani
      baslik="Bucket List"
      altBaslik="Birlikte yapılacaklar listesi ✨"
      ikon={Sparkles}
      mesaj="Hayallerinizi ve birlikte yapmak istediklerinizi listeleyeceğiniz bu bölüm üzerinde çalışıyoruz."
    />
  );
}
