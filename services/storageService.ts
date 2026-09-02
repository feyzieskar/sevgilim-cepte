// ====================================================================
// STORAGE SERVİSİ (Supabase Storage — Private Buckets)
// ====================================================================
// Fotoğraf yükleme, silme ve signed URL oluşturma yardımcıları.
//
// GÜVENLİK: Bucket'lar private; dosyalara erişim signed URL gerektirir.
// Public URL'ler artık kullanılmaz. Database'de yalnızca storage path
// saklanır; gösterim anında signed URL oluşturulur.
//
// Dosya yolu formatı: <user-id>/<uuid>.jpg
//
// Kullanılan bucket'lar:
//   - memory-photos  : anı fotoğrafları
//   - surprise-media : sürpriz fotoğrafları
//   - streak-photos  : günlük streak fotoğrafları
// ====================================================================

import { decode } from "base64-arraybuffer";

import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

export type FotoBucket = "memory-photos" | "surprise-media" | "streak-photos";

/** Signed URL geçerlilik süresi (saniye) — 1 saat */
const SIGNED_URL_EXPIRY = 3600;

// Benzersiz dosya adı üretir: <user-id>/<uuid>.ext
function yeniDosyaYolu(uzanti: string): string {
  const userId = useAuthStore.getState().user?.id ?? "anonymous";
  const uuid = generateUUID();
  return `${userId}/${uuid}.${uzanti}`;
}

// Basit UUID v4 üretimi (crypto.randomUUID mümkünse onu kullan)
function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: RFC 4122 v4 uyumlu
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * base64 fotoğrafı verilen bucket'a yükler.
 * Başarılıysa storage path, aksi halde null döner.
 *
 * NOT: Artık public URL yerine storage path döner.
 * Gösterim için `getSignedPhotoUrl()` kullanın.
 */
export async function uploadPhoto(
  bucket: FotoBucket,
  base64: string,
  uzanti: string = "jpg"
): Promise<string | null> {
  try {
    const dosyaYolu = yeniDosyaYolu(uzanti);
    const icerik = decode(base64);
    const contentType = uzanti === "png" ? "image/png" : "image/jpeg";

    const { error } = await supabase.storage
      .from(bucket)
      .upload(dosyaYolu, icerik, { contentType, upsert: false });

    if (error) {
      console.warn("[storageService] yükleme hatası:", error.message);
      return null;
    }

    // Storage path döndür (public URL değil)
    return dosyaYolu;
  } catch (e) {
    console.warn("[storageService] yükleme istisnası:", e);
    return null;
  }
}

/**
 * Storage path veya legacy public URL'den signed URL oluşturur.
 * Signed URL kısa ömürlüdür ve database'e kaydedilmemelidir.
 */
export async function getSignedPhotoUrl(
  bucket: FotoBucket,
  pathOrUrl: string
): Promise<string | null> {
  const storagePath = extractStoragePath(bucket, pathOrUrl);
  if (!storagePath) return null;

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRY);

    if (error || !data?.signedUrl) {
      console.warn("[storageService] signed URL hatası:", error?.message);
      return null;
    }

    return data.signedUrl;
  } catch (e) {
    console.warn("[storageService] signed URL istisnası:", e);
    return null;
  }
}

/**
 * Storage path veya legacy public URL ile dosyayı siler.
 * Hata olsa bile sessizce geçer (yetim dosya kritik değil).
 */
export async function deletePhoto(bucket: FotoBucket, pathOrUrl?: string): Promise<void> {
  if (!pathOrUrl) return;
  const storagePath = extractStoragePath(bucket, pathOrUrl);
  if (!storagePath) return;
  try {
    await supabase.storage.from(bucket).remove([storagePath]);
  } catch {
    // sessizce geç
  }
}

/**
 * Legacy public URL veya yeni storage path'ten object path çıkarır.
 *
 * Desteklenen formatlar:
 *   - "https://.../storage/v1/object/public/memory-photos/abc.jpg" → "abc.jpg"
 *   - "user-id/abc.jpg" → "user-id/abc.jpg"
 *   - Geçersiz → null
 */
export function extractStoragePath(bucket: FotoBucket, value: string): string | null {
  if (!value || value.trim() === "") return null;

  // Legacy public URL formatı
  const publicMarker = `/object/public/${bucket}/`;
  const publicIdx = value.indexOf(publicMarker);
  if (publicIdx !== -1) {
    return value.slice(publicIdx + publicMarker.length);
  }

  // Signed URL formatı (token ile)
  const signedMarker = `/object/sign/${bucket}/`;
  const signedIdx = value.indexOf(signedMarker);
  if (signedIdx !== -1) {
    const pathWithParams = value.slice(signedIdx + signedMarker.length);
    return pathWithParams.split("?")[0]; // Query parametrelerini kaldır
  }

  // Eğer URL gibi görünmüyorsa, doğrudan storage path olarak kabul et
  if (!value.startsWith("http")) {
    return value;
  }

  // Tanınmayan URL
  return null;
}

// --- Geriye dönük uyumluluk (eski fonksiyon adları) ---

/** @deprecated uploadPhoto kullanın */
export const fotoYukle = uploadPhoto;

/** @deprecated deletePhoto kullanın */
export const fotoSil = deletePhoto;
