// ====================================================================
// STORAGE SERVİSİ (Supabase Storage)
// ====================================================================
// Fotoğraf yükleme/silme yardımcıları. Yerel bir fotoğrafın base64
// içeriğini alır, ilgili bucket'a yükler ve public URL döndürür.
//
// Kullanılan bucket'lar:
//   - memory-photos  : anı fotoğrafları
//   - surprise-media : sürpriz fotoğrafları
//   - streak-photos  : günlük streak fotoğrafları
//
// React Native'de güvenilir yükleme için base64 -> ArrayBuffer dönüşümü
// kullanılır (Blob yöntemi RN'de bazen 0 bayt yükler).
// ====================================================================

import { decode } from "base64-arraybuffer";

import { supabase } from "@/lib/supabase";

export type FotoBucket = "memory-photos" | "surprise-media" | "streak-photos";

// Benzersiz dosya adı üretir
function yeniDosyaAdi(uzanti: string): string {
  const damga = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${damga}.${uzanti}`;
}

// base64 fotoğrafı verilen bucket'a yükler; başarılıysa public URL,
// aksi halde null döner.
export async function fotoYukle(
  bucket: FotoBucket,
  base64: string,
  uzanti: string = "jpg"
): Promise<string | null> {
  try {
    const dosyaAdi = yeniDosyaAdi(uzanti);
    const icerik = decode(base64);
    const contentType = uzanti === "png" ? "image/png" : "image/jpeg";

    const { error } = await supabase.storage
      .from(bucket)
      .upload(dosyaAdi, icerik, { contentType, upsert: false });

    if (error) {
      console.warn("[storageService] yükleme hatası:", error.message);
      return null;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(dosyaAdi);
    return data.publicUrl;
  } catch (e) {
    console.warn("[storageService] yükleme istisnası:", e);
    return null;
  }
}

// Public URL'den bucket içindeki dosya yolunu çıkarır.
// Örn: ".../object/public/memory-photos/123.jpg" -> "123.jpg"
function urldenYol(bucket: FotoBucket, url: string): string | null {
  const ayrac = `/${bucket}/`;
  const idx = url.indexOf(ayrac);
  if (idx === -1) return null;
  return url.slice(idx + ayrac.length);
}

// Daha önce yüklenmiş bir fotoğrafı (public URL ile) siler.
// Hata olsa bile sessizce geçer (yetim dosya kritik değil).
export async function fotoSil(bucket: FotoBucket, url?: string): Promise<void> {
  if (!url) return;
  const yol = urldenYol(bucket, url);
  if (!yol) return;
  try {
    await supabase.storage.from(bucket).remove([yol]);
  } catch {
    // sessizce geç
  }
}
