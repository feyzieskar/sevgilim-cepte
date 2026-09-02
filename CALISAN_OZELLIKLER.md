# Sevgilim Cepte — Çalışan Özellikler Özeti

> Son güncelleme: 27 Temmuz 2026  
> Bu belge, bugüne kadar geliştirilmiş ve çalışır durumda olan özellikleri özetler.  
> Proje: çift için ortak romantik hediye uygulaması (React Native + Expo + Supabase).

---

## 1. Genel bakış

| Alan            | Durum                                                      |
| --------------- | ---------------------------------------------------------- |
| Teknoloji       | Expo SDK 54, TypeScript, NativeWind, Zustand, Supabase     |
| Navigasyon      | `expo-router` — auth + 5 sekme                             |
| Backend         | Supabase Auth, Postgres, Storage, Realtime, RLS            |
| Hedef kullanıcı | 2 kişi (sen + sevgilin), partner bağlantısı ile ortak veri |

Uygulama açılınca oturum kontrol edilir; giriş yoksa login ekranı, varsa ana sekmeler açılır. Giriş sonrası tüm bulut verisi bir kez çekilir ve Realtime abonelikleri kurulur.

---

## 2. Kimlik doğrulama (Auth)

**Durum: çalışıyor**

- E-posta + şifre ile kayıt / giriş (`app/(auth)/login.tsx`)
- Oturum AsyncStorage ile kalıcı (uygulama kapanınca oturum korunur)
- Otomatik giriş: açılışta kayıtlı session yüklenir
- Çıkış: ana ekranda onaylı “çıkış” butonu
- Ana ekran selamlamasında kullanıcı adı görünür (`display_name` → e-posta kullanıcı adı)
- Realtime için access token otomatik iletilir (`supabase.realtime.setAuth`)

**İlgili dosyalar:** `store/authStore.ts`, `lib/supabase.ts`, `app/_layout.tsx`

---

## 3. Ana ekran — “Bugün Biz”

**Durum: çalışıyor**

| Kart                     | Ne yapıyor                                                             |
| ------------------------ | ---------------------------------------------------------------------- |
| Bugünkü Etkinlik         | Takvim store’dan bugünün ilk etkinliğini gösterir                      |
| Sonraki Özel Gün         | En yakın tekrar eden özel güne geri sayım                              |
| Günün Mesajı             | Günlük seçilen romantik mesaj                                          |
| Feyzi AI’a Sor           | Feyzi sekmesine kısayol                                                |
| Bugün Seni Sevme Sebebim | Yerleşik + özel sebepler; kalple rastgele, kalemle özel sebep ekle/sil |

Ek: gündüz/gece tema düğmesi, çıkış düğmesi, kişiselleştirilmiş selamlama.

**İlgili dosyalar:** `app/(tabs)/index.tsx`, `components/cards/*`

---

## 4. Takvim

**Durum: çalışıyor (Supabase + Realtime)**

- Aylık takvim (`react-native-calendars`), kategori renkli noktalar
- Etkinlik ekle / düzenle / sil
- Kategoriler: randevu, tatil, özel gün vb.
- Hatırlatıcı (yerel bildirim) — cihaz bazlı
- Pull-to-refresh
- Partnerin eklediği etkinlik Realtime ile anında görünür

**Veri:** `events` tablosu (ortak, RLS: ben + partner)

**İlgili dosyalar:** `app/(tabs)/takvim.tsx`, `store/calendarStore.ts`, `components/calendar/*`

---

## 5. Bize özel günler (tekrar eden)

**Durum: çalışıyor (Supabase + Realtime)**

Örnek/sabit özel gün listesi kaldırıldı. Artık tamamen buluttan yönetilir:

- Yeni özel gün ekle (başlık, emoji, gün+ay)
- Mevcut günün **tarihini, başlığını, emojisini düzenle**
- Sil
- Her yıl tekrar eder (yıl tutulmaz)
- Ana ekrandaki geri sayım bu listeye bağlı
- Partnerle ortak ve anlık senkron

**Veri:** `special_days` tablosu

**İlgili dosyalar:** `store/ozelGunStore.ts`, `components/calendar/OzelGunlerListesi.tsx`, `components/calendar/OzelGunFormModal.tsx`, `data/ozelGunler.ts` (yalnızca tip + yardımcılar)

> Takvim sekmesindeki “Özel Günler” görünümü artık yalnızca bu tekrar eden günleri listeler; tek seferlik `ozel_gun` kategorili takvim etkinlikleri buraya karışmaz.

---

## 6. Anılar

**Durum: çalışıyor (Supabase + Private Storage + Signed URLs)**

- Anı ekle (not, tarih, konum, fotoğraf)
- Galeri / kamera ile fotoğraf seçimi
- Fotoğraf `memory-photos` private bucket’ına yüklenir
- Signed URL ile güvenli partner erişimi (1 saatlik geçerlilik)
- Anı detay: görüntüle, düzenle, sil, favori
- Harita / “bu gün ne olmuştu” bileşenleri
- Pull-to-refresh

**Veri:** `memories` tablosu + Storage `memory-photos` (private)

**İlgili dosyalar:** `store/memoryStore.ts`, `app/(tabs)/anilar.tsx`, `app/ani/[id].tsx`, `services/storageService.ts`, `services/media.ts`

---

## 7. Sürprizler

**Durum: çalışıyor (Supabase + Private Storage + Realtime + bildirim)**

- Sürpriz ekle (başlık, mesaj, opsiyonel fotoğraf, açılma tipi)
- Açılma tipleri: tarih, tatil öncesi, “kötü hissediyorum”, “seni özledim”
- Fotoğraf `surprise-media` private bucket’ına yüklenir (signed URL ile gösterim)
- Partner yeni sürpriz ekleyince:
  - Liste anında güncellenir (Realtime)
  - Yerel bildirim: “Sana bir sürpriz var 🎁”
- Hızlı açma butonları (sad / miss)
- Pull-to-refresh

**Veri:** `surprises` tablosu + Storage `surprise-media` (private)

**İlgili dosyalar:** `store/surpriseStore.ts`, `app/(tabs)/surprizler.tsx`, `components/surprise/*`, `services/notifications.ts`

---

## 8. Feyzi AI (sohbet + araç çağırma)

**Durum: çalışıyor (Supabase Edge Function + GPT-4o)**

- Metin sohbeti: OpenAI GPT-4o (Supabase `feyzi-chat` Edge Function üzerinden proxy)
- **Güvenlik:** API anahtarı sunucuda saklanır, istemci paketine gömülmez
- **Araç çağırma (Function Calling):** Takvime etkinlik, özel gün ve sevme sebebi ekleme
- Yazma işlemlerinden önce onay kartı gösterilir
- Modlar: Normal, Moral, Plan, Anı
- Anı modunda son anılardan bağlam üretilir
- Mesaj geçmişi Supabase’de **kişisel** saklanır (partner göremez)
- Cihazlar arası geçmiş senkronu
- Sohbeti temizle → buluttaki kendi mesajları da silinir
- Seçili mod cihazda yerel tutulur

**Veri:** `chat_messages` tablosu (RLS: sadece `user_id = auth.uid()`)

**İlgili dosyalar:** `store/chatStore.ts`, `app/(tabs)/feyzi-ai.tsx`, `services/feyziService.ts`, `supabase/functions/feyzi-chat/index.ts`

---

## 9. Sevme sebepleri

**Durum: çalışıyor (hibrit: yerleşik + ortak özel)**

- Yerleşik ~50 sebep (`data/sevmeSebepleri.ts`)
- Çiftin eklediği özel sebepler Supabase’de ortak
- Ana kartta kalp → rastgele sebep
- Kalem → modal: özel sebep ekle / sil
- Partner eklediğinde Realtime ile güncellenir

**Veri:** `love_reasons` tablosu

**İlgili dosyalar:** `store/loveReasonStore.ts`, `components/cards/SevmeSebebiKarti.tsx`

---

## 10. Tema ve UI

**Durum: çalışıyor**

- Gündüz / gece modu (Zustand + kalıcı)
- NativeWind + romantik palet / gradyan kartlar
- Ortak başlık bileşeni (`EkranBasligi`)

**İlgili dosyalar:** `store/useThemeStore.ts`, `constants/theme.ts`, `components/ui/*`

---

## 11. Supabase veri modeli

| Tablo           | Paylaşım      | Realtime             |
| --------------- | ------------- | -------------------- |
| `profiles`      | Ben + partner | —                    |
| `events`        | Ortak         | Evet                 |
| `memories`      | Ortak         | Hayır (isteğe bağlı) |
| `surprises`     | Ortak         | Evet                 |
| `love_reasons`  | Ortak         | Evet                 |
| `special_days`  | Ortak         | Evet                 |
| `chat_messages` | Kişisel       | Hayır                |

**Storage bucket’ları**

| Bucket           | Amaç             |
| ---------------- | ---------------- |
| `memory-photos`  | Anı fotoğrafları |
| `surprise-media` | Sürpriz medyası  |

**Güvenlik:** Tüm tablolarda RLS. Ortak veriler `linked_user_ids()` ile yalnızca bağlı çift arasında görünür. Partner bağlantısı `profiles.partner_id` üzerinden yapılır.

Tam şema: `migration.sql`

---

## 12. Partner bağlantısı (önemli)

İki hesabın veriyi görmesi için Supabase SQL Editor’da partner eşlemesi gerekir (örnek):

```sql
-- Önce kullanıcı UUID'lerini görmek için:
select id, display_name from public.profiles;

-- Sonra karşılıklı bağla (UUID'leri kendi değerlerinle değiştir):
update public.profiles set partner_id = '<PARTNER_UUID>' where id = '<BENIM_UUID>';
update public.profiles set partner_id = '<BENIM_UUID>' where id = '<PARTNER_UUID>';
```

Bağlantı yoksa her kullanıcı yalnızca kendi satırlarını görür.

---

## 13. Ortam değişkenleri

`.env` (gitignore’da; örnek: `.env.example`):

| Değişken                         | Gerekli mi      | Amaç               |
| -------------------------------- | --------------- | ------------------ |
| `EXPO_PUBLIC_SUPABASE_URL`       | Evet            | Supabase proje URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY`  | Evet            | Anon / public key  |
| `OPENAI_API_KEY`                 | Feyzi için      | GPT sohbet         |
| `EXPO_PUBLIC_ELEVENLABS_API_KEY` | Hayır (ileride) | Ses                |
| `EXPO_PUBLIC_DID_API_KEY`        | Hayır (ileride) | Konuşan video      |

---

## 14. Nasıl çalıştırılır

```bash
npm install --legacy-peer-deps
npx expo start --clear
```

Telefonda Expo Go ile QR kodu okut. İlk kurulumda Supabase SQL Editor’da `migration.sql` (veya eksik parçalar, örn. `special_days`) çalıştırılmış olmalı.

> **Not (27 Temmuz 2026):** `node_modules` bozulmuşsa (ör. `expo` klasörü ~KB seviyesinde) Metro takılır. Çözüm: `rm -rf node_modules && npm install --legacy-peer-deps`, sonra `npx expo start --clear`.

---

## 15. Otomatik doğrulama (27 Temmuz 2026)

| Kontrol                                | Sonuç                                                                   |
| -------------------------------------- | ----------------------------------------------------------------------- |
| `npm install --legacy-peer-deps`       | Başarılı (~452 MB `node_modules`)                                       |
| `tsc --noEmit`                         | Başarılı (hata yok)                                                     |
| Metro iOS bundle (`expo-router/entry`) | HTTP 200, ~13 MB bundle üretildi                                        |
| Expo simctl                            | Uyarı: Xcode `simctl` eksik/bozuk (cihazda Expo Go ile test edilebilir) |
| `expo` sürümü                          | Küçük uyarı: 54.0.35 → beklenen ~54.0.36                                |

---

## 16. Manuel test kontrol listesi

- [ ] Kayıt / giriş / çıkış
- [ ] Ana ekranda kendi adın görünüyor
- [ ] Takvime etkinlik ekle → partnerde anında görünüyor
- [ ] Özel Günler: ekle, tarihi düzenle, sil → partnerde güncelleniyor
- [ ] Anı + fotoğraf ekle → listede / detayda görünüyor
- [ ] Sürpriz ekle → partnerde anında + bildirim
- [ ] Sevme sebebi özel ekle → partnerde rotasyona giriyor
- [ ] Feyzi’ye yaz → uygulamayı kapat-aç, geçmiş geliyor; partnerde görünmüyor
- [ ] Tema gündüz/gece geçişi

---

## 17. Bilinen sınırlar / sonraki adımlar

| Konu                | Not                                                                            |
| ------------------- | ------------------------------------------------------------------------------ |
| Offline cache       | Çekilmiş veri bellekte; tam offline/queue henüz yok                            |
| Partner UI          | ✅ Profil ekranında 6 haneli güvenli eşleşme kodu ile uygulama içinden eşleşme |
| Push (uzak)         | ✅ Expo Push API + Supabase Edge Function (`send-push`) ile entegre            |
| Sesli / video Feyzi | Gelecek faz için planlandı                                                     |
| Anılar Realtime     | Açılış/fetch + refresh ile senkron                                             |
| Güvenlik            | ✅ OpenAI Edge Function proxy, private storage (signed URL), RLS               |

---

## 18. Önemli dosya haritası

```
app/
  (auth)/login.tsx          # Giriş / kayıt
  (tabs)/                   # 5 sekme + bootstrap (fetch + realtime)
  ani/[id].tsx              # Anı detay
store/
  authStore.ts
  calendarStore.ts
  memoryStore.ts
  surpriseStore.ts
  loveReasonStore.ts
  ozelGunStore.ts
  chatStore.ts
  useThemeStore.ts
lib/supabase.ts
services/
  storageService.ts         # Storage yükle / sil
  media.ts                  # Galeri / kamera (+ base64)
  notifications.ts          # Yerel hatırlatıcı + anlık bildirim
  feyziService.ts           # OpenAI sohbet
migration.sql               # Tüm DB + RLS + Storage + Realtime
```

---

**Özet:** Faz 1 (iskelet + yerel özellikler) ve Faz 2 (Supabase: auth, takvim, anılar, sürprizler, sohbet, sevme sebepleri, özel günler, realtime senkron) tamamlanmış ve kullanımda. Partner bağlantısı ve güncel `migration.sql` SQL’inin Supabase’de uygulanmış olması gerekir.
