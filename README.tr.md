# Sevgilim Cepte 💕

[![CI](https://github.com/feyzieskar/sevgilim-cepte/actions/workflows/ci.yml/badge.svg)](https://github.com/feyzieskar/sevgilim-cepte/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)
![Expo SDK](https://img.shields.io/badge/Expo_SDK-54-000020)

[English](README.md) | [Türkçe](#)

> İki kullanıcı için özel, React Native + Expo + TypeScript + Supabase ile geliştirilmiş iOS eşlik uygulaması.

Sevgilim Cepte; ortak takvim, fotoğraflı anılar, ruh hali paylaşımı, günlük fotoğraf serisi, sürpriz kutusu ve AI asistanı bir arada sunar — tüm veriler iki partner arasında anlık olarak senkronize edilir.

---

## ✨ Özellikler

### 📅 Ortak Takvim

- Kategori renkli paylaşımlı etkinlikler
- Yerel bildirimle hatırlatıcılar
- Apple Takvim'e aktarma
- Partnerle anlık senkron

### 📸 Anılar

- Fotoğraf, tarih, not ve konum bilgisiyle anı ekleme
- Zaman tüneli, favoriler, "Bu gün ne olmuştu?" özelliği
- Harita üzerinde konumlu anılar

### 💬 Feyzi AI Asistan

- OpenAI GPT-4o destekli sohbet
- Normal, Moral, Plan ve Anı modları
- Takvime etkinlik, özel gün ve sevme sebebi ekleme (araç çağrısı)
- Yazma işlemlerinden önce kullanıcı onayı

### 💕 Partner Deneyimi

- Ruh hali paylaşımı
- Günlük fotoğraf serisi (streak)
- Bucket list
- Sevme sebepleri
- Sürpriz kutusu
- Push bildirimler

### 🛡️ Güvenlik

- API anahtarları yalnızca sunucu tarafında (Edge Functions)
- Özel medya depolaması (signed URL)
- Her tabloda Row Level Security
- Partner-only erişim modeli

---

## 🏗️ Teknoloji

| Katman      | Teknoloji                                          |
| ----------- | -------------------------------------------------- |
| **Mobil**   | React Native, Expo SDK 54, TypeScript, Expo Router |
| **Stil**    | NativeWind                                         |
| **State**   | Zustand                                            |
| **Backend** | Supabase Auth, PostgreSQL, Realtime, Storage       |
| **Sunucu**  | Supabase Edge Functions                            |
| **AI**      | OpenAI GPT-4o                                      |
| **CI**      | GitHub Actions, Jest, ESLint                       |

---

## 🚀 Kurulum

```bash
git clone https://github.com/feyzieskar/sevgilim-cepte.git
cd sevgilim-cepte
npm install
cp .env.example .env
# .env'ye Supabase URL ve anon key'ini gir
npx expo start
```

Sunucu anahtarları (OpenAI vb.) istemci `.env`'ye **eklenmez**:

```bash
supabase secrets set OPENAI_API_KEY=sk-...
```

---

## 📖 Dokümantasyon

- [Mimari](docs/ARCHITECTURE.md)
- [Güvenlik Mimarisi](docs/SECURITY_ARCHITECTURE.md)
- [Portfolyo Metinleri](docs/PORTFOLIO_COPY.md)

---

## 🧪 Geliştirme

```bash
npm run lint          # ESLint
npm run typecheck     # TypeScript kontrolü
npm run test          # Jest testleri
npm run format        # Prettier formatlama
npm run check         # Tüm kontroller
```
