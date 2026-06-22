// ====================================================================
// MEDYA & KONUM SERVİSİ
// ====================================================================
// Fotoğraf seçme (galeri/kamera) ve mevcut konumu alma işlemleri.
// İzinler ilgili işlem anında istenir.
// ====================================================================

import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

// Galeriden fotoğraf seçer; seçilen URI'yi (yoksa null) döndürür.
export async function galeridenSec(): Promise<string | null> {
  const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!izin.granted) return null;

  const sonuc = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 0.8,
  });

  if (sonuc.canceled || sonuc.assets.length === 0) return null;
  return sonuc.assets[0].uri;
}

// Kameradan fotoğraf çeker; çekilen URI'yi (yoksa null) döndürür.
export async function kameradanCek(): Promise<string | null> {
  const izin = await ImagePicker.requestCameraPermissionsAsync();
  if (!izin.granted) return null;

  const sonuc = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    quality: 0.8,
  });

  if (sonuc.canceled || sonuc.assets.length === 0) return null;
  return sonuc.assets[0].uri;
}

export interface KonumBilgisi {
  latitude: number;
  longitude: number;
  locationName?: string;
}

// Mevcut konumu alır ve mümkünse yer adını çözer.
export async function mevcutKonum(): Promise<KonumBilgisi | null> {
  const izin = await Location.requestForegroundPermissionsAsync();
  if (!izin.granted) return null;

  const konum = await Location.getCurrentPositionAsync({});
  const { latitude, longitude } = konum.coords;

  let locationName: string | undefined;
  try {
    const yerler = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (yerler.length > 0) {
      const y = yerler[0];
      // Şehir / ilçe / bölge gibi en anlamlı adı seç
      locationName =
        y.city || y.subregion || y.region || y.district || y.name || undefined;
    }
  } catch {
    // Ters jeokodlama başarısız olursa sadece koordinatları kullan
  }

  return { latitude, longitude, locationName };
}
