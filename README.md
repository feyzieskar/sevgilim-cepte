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

## Tamamlananlar (1. Adım)

- [x] Expo + TypeScript + expo-router + NativeWind iskeleti
- [x] Romantik tema (soft pembe #FF6B9D + lila #A06CD5), açık/koyu mod
- [x] 5 sekmeli alt navigasyon + iskelet ekranlar
- [x] Ana ekran 5 kart (mock veri ile çalışır):
  - Bugünkü Etkinlik · Sonraki Özel Gün · Günün Mesajı · Feyzi AI'a Sor · Sevme Sebebim

## Sıradaki Adımlar

1. **Takvim** — `react-native-calendars`, etkinlik/hatırlatıcı, Apple Takvim aktarımı
2. **Anılar** — fotoğraf, timeline, harita, gizli notlar
3. **Feyzi AI** — OpenAI GPT-4o + modlar; `services/feyziAi.ts` içindeki kişilik prompt'unu doldur
4. **Sürprizler** — kilitli kartlar + açılma koşulları
5. **Kalıcı veri** — SQLite/AsyncStorage, ardından Supabase

---

## API Anahtarları

`.env.example` dosyasını `.env` olarak kopyalayıp anahtarlarını gir. Gizli anahtarlar için uygulama içinde `expo-secure-store` kullanılacaktır. `.env` dosyası git'e **dahil edilmez**.

---

## Özelleştirme İpuçları

- **Sevme sebepleri**: `data/sevmeSebepleri.ts` (50+ hazır, istediğin gibi düzenle)
- **Günün mesajları**: `data/gununMesajlari.ts`
- **Özel günler** (yıldönümü, doğum günleri): `data/ozelGunler.ts` — tarihleri kendine göre güncelle
- **Renkler**: `constants/theme.ts` ve `tailwind.config.js`
- **Feyzi kişiliği**: `services/feyziAi.ts` → `FEYZI_KISILIK_PROMPT`
