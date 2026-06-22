# Sevgilim Cepte 💕

Tek kişiye özel, romantik bir hediye uygulaması. React Native + Expo (TypeScript) ile geliştirilmiştir. iOS'a `EAS Build` + TestFlight ile dağıtılır.

> Bu repo şu an **1. Adım (iskelet)** durumundadır: tema, 5 sekmeli navigasyon ve mock veriyle çalışan ana ekran kartları hazırdır. Backend ve AI entegrasyonları sonraki adımlarda eklenecektir.

---

## Teknoloji Stack

| Alan | Seçim |
|------|-------|
| Çatı | Expo (managed) + TypeScript |
| Navigasyon | `expo-router` (dosya tabanlı, tab bar) |
| Stil | `nativewind` (Tailwind for RN) v4 |
| State | `zustand` |
| İkonlar | `@expo/vector-icons` |
| Gradyan | `expo-linear-gradient` |
| Güvenli depolama | `expo-secure-store` (AI anahtarları için) |

İleride: Supabase (backend), OpenAI GPT-4o (sohbet), ElevenLabs (TTS), D-ID (konuşan video), `react-native-calendars`, `react-native-maps`, `expo-notifications`, `expo-image-picker`, `expo-calendar`.

---

## Kurulum (Mac üzerinde)

> Geliştirme Windows'ta yapılıyor olabilir, ancak iOS build için **Mac + Xcode** gerekir. Node.js 20+ kurulu olmalı.

```bash
# 1) Bağımlılıkları yükle
npm install

# 2) Tüm Expo paketlerini SDK ile uyumlu sürümlere hizala (ÖNEMLİ)
npx expo install --fix

# 3) Geliştirme sunucusunu başlat
npx expo start
```

Telefonda denemek için **Expo Go** uygulamasını App Store'dan indirip QR kodu okutabilirsin (yerel özellikler için ileride development build gerekecek).

### iOS Simülatörde çalıştırma (Mac)

```bash
npx expo start --ios
```

---

## Klasör Yapısı

```
.
├── app/                      # expo-router ekranları (dosya = route)
│   ├── _layout.tsx           # Kök yerleşim (tema, providers)
│   └── (tabs)/               # Alt tab bar grubu
│       ├── _layout.tsx       # Tab bar tanımı (5 sekme)
│       ├── index.tsx         # 🏠 Bugün Biz (ana ekran)
│       ├── takvim.tsx        # 📅 Takvim (iskelet)
│       ├── anilar.tsx        # 📸 Anılar (iskelet)
│       ├── feyzi-ai.tsx      # 💬 Feyzi AI (iskelet)
│       └── surprizler.tsx    # 🎁 Sürprizler (iskelet)
├── components/
│   ├── cards/                # Ana ekran kartları (5 adet)
│   └── ui/                   # Ortak bileşenler (GradientCard, başlık, vb.)
├── store/                    # Zustand store'ları (tema)
├── services/                 # Dış servisler (Feyzi AI placeholder)
├── constants/                # Tema renkleri + yardımcılar
├── data/                     # Mock veri (mesajlar, sebepler, özel günler)
├── global.css                # NativeWind giriş dosyası
├── tailwind.config.js        # Tailwind/NativeWind teması
└── app.json                  # Expo yapılandırması
```

---

## Tamamlananlar

**1. Adım — İskelet**
- [x] Expo + TypeScript + expo-router + NativeWind iskeleti
- [x] Romantik tema (soft pembe #FF6B9D + lila #A06CD5), açık/koyu mod
- [x] 5 sekmeli alt navigasyon + iskelet ekranlar
- [x] Ana ekran 5 kart (mock veri ile çalışır)

**2. Adım — Ortak Takvim** ✅
- [x] Aylık takvim görünümü (`react-native-calendars`), kategori renginde noktalar
- [x] Etkinlik ekle / düzenle / sil (alttan açılan form modalı)
- [x] Renkli kategoriler: Tatil (mavi) · Buluşma (pembe) · Özel Gün (mor) · İş/Okul (gri)
- [x] Hatırlatıcı (`expo-notifications`) — tarih/saatte bildirim
- [x] Seçili günün etkinlik listesi (kart liste)
- [x] "Bize Özel Günler" sekmesi — geri sayımlı liste
- [x] Apple Takvim'e Aktar (`expo-calendar`)
- [x] Yerel kalıcılık: Zustand + AsyncStorage (`store/calendarStore.ts`)

**3. Adım — Anılar** ✅
- [x] Anı ekle/düzenle: fotoğraf (`expo-image-picker` galeri/kamera) + tarih + not + konum
- [x] Zaman tüneli (en yeni üstte) fotoğraf kartları
- [x] "Bu gün ne olmuştu?" — geçmiş yıl eşleşmeleri ("Geçen yıl bugün…")
- [x] Favoriler: kalp ile favorile, "Favoriler" filtresi
- [x] Harita görünümü (`react-native-maps`) — konumlu anılar pin + önizleme
- [x] Konum (`expo-location`) — "Konumumu kullan" + ters jeokodlama
- [x] Anı detay ekranı (`app/ani/[id].tsx`): büyük foto, mini harita, düzenle/sil
- [x] Yerel kalıcılık: `store/memoryStore.ts`

> Notlar: Fotoğraflar şimdilik cihazdaki yerel URI olarak saklanır (sonra Supabase Storage'a taşınacak). `react-native-maps` ve `expo-image-picker`/kamera Expo Go'da sınırlıdır; tam test için **development build** önerilir. "Gizli notlar / belli tarihte açılan anılar" özelliği Bölüm 5 (Sürpriz Kutusu) ile gelecek.

**4. Adım — Feyzi AI (metin sohbeti)** ✅
- [x] OpenAI GPT-4o ile metin sohbeti (`services/feyziService.ts`, doğrudan fetch)
- [x] Mesaj balonları (Feyzi gradyan / kullanıcı nötr), avatar, "Feyzi yazıyor..."
- [x] 4 mod: Normal / Moral / Plan / Anı (Anı modu son anıları context'e ekler)
- [x] Sesli & Video modları "Yakında" etiketiyle pasif
- [x] Sohbet geçmişi kalıcı (`store/chatStore.ts`)
- [x] API anahtarı: `.env` (`OPENAI_API_KEY`) → `app.config.js` extra → `expo-secure-store`
- [x] Düzenlenebilir promptlar: `constants/feyziPrompts.ts`

> Sesli mod (ElevenLabs) ve Video mod (D-ID) sonraki fazda eklenecek.

## Sıradaki Adımlar

1. **Sürprizler** — kilitli kartlar + açılma koşulları (+ gizli notlar)
2. **Feyzi AI — Sesli/Video** — ElevenLabs (TTS) + D-ID (konuşan video)
3. **Backend** — Supabase (auth + postgres + storage)

---

## API Anahtarları

`.env.example` dosyasını `.env` olarak kopyalayıp anahtarlarını gir. `.env` dosyası git'e **dahil edilmez**.

Feyzi AI sohbetinin çalışması için `.env` içine OpenAI anahtarını ekle:

```
OPENAI_API_KEY=sk-...
```

Bu anahtar `app.config.js` ile uygulamaya geçer ve ilk açılışta `expo-secure-store`'a yazılıp oradan okunur. `.env`'i değiştirdiğinde Metro'yu önbelleği temizleyerek yeniden başlat: `npx expo start -c`.

---

## Özelleştirme İpuçları

- **Sevme sebepleri**: `data/sevmeSebepleri.ts` (50+ hazır, istediğin gibi düzenle)
- **Günün mesajları**: `data/gununMesajlari.ts`
- **Özel günler** (yıldönümü, doğum günleri): `data/ozelGunler.ts` — tarihleri kendine göre güncelle
- **Renkler**: `constants/theme.ts` ve `tailwind.config.js`
- **Feyzi kişiliği & mod promptları**: `constants/feyziPrompts.ts` → `FEYZI_BASE_PERSONALITY` ve `MODE_PROMPTS`
