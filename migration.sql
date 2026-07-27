-- ====================================================================
-- Sevgilim Cepte — Supabase Migrasyonu (Faz 2)
-- ====================================================================
-- Bu dosyayı Supabase panelinde "SQL Editor" üzerinden TEK SEFERDE
-- çalıştır. Tüm tabloları, Row Level Security (RLS) politikalarını,
-- otomatik profil oluşturma tetikleyicisini ve Storage bucket'larını
-- kurar.
--
-- Uygulama yalnızca 2 kullanıcı içindir (ben + sevgilim). Güvenlik
-- modeli: bir kullanıcı yalnızca KENDİ veya PARTNER'ının verilerini
-- görebilir/değiştirebilir.
--
-- Çalıştırma sırası önemli: en üstten en alta doğru.
-- ====================================================================


-- ====================================================================
-- 1) profiles — Kullanıcı profili
-- ====================================================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  partner_id   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;


-- ====================================================================
-- 1a) YARDIMCI: Bağlı kullanıcı kimlikleri (ben + partnerim)
-- ====================================================================
-- RLS politikalarında tekrar tekrar kullanılır. SECURITY DEFINER olduğu
-- için profiles tablosundaki RLS'i atlar -> sonsuz döngü (recursion)
-- riskini engeller. Hem benim partner_id'm hem de beni partner seçenin
-- kimliği dahil edilir (çift yönlü eşleşme).
-- NOT: 'language sql' fonksiyonlar oluşturulurken gövdesi doğrulandığı
--      için bu blok, referans verdiği profiles tablosundan SONRA gelmeli.
-- ====================================================================
create or replace function public.linked_user_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid()
  union
  select partner_id from public.profiles
    where id = auth.uid() and partner_id is not null
  union
  select id from public.profiles
    where partner_id = auth.uid();
$$;

-- Kendi ve partner profilini görebilir
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (id in (select public.linked_user_ids()));

-- Yalnızca kendi profilini güncelleyebilir
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Kendi profil satırını ekleyebilir (tetikleyici de ekler; yedek olarak)
drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles
  for insert with check (id = auth.uid());


-- ====================================================================
-- 1b) Yeni kullanıcı kaydında otomatik profil oluşturma
-- ====================================================================
-- auth.users'a her yeni kayıt eklendiğinde public.profiles'a karşılık
-- gelen satır otomatik açılır. display_name, signUp sırasında
-- options.data.display_name olarak gönderilir.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', null))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ====================================================================
-- 2) events — Takvim etkinlikleri
-- ====================================================================
create table if not exists public.events (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  date         date not null,                       -- "YYYY-MM-DD"
  time         text,                                -- "HH:mm" (opsiyonel)
  category     text not null
                 check (category in ('tatil','bulusma','ozel_gun','is_okul')),
  note         text,
  has_reminder boolean not null default false,
  created_by   uuid not null default auth.uid()
                 references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now()
);

create index if not exists events_date_idx on public.events (date);
create index if not exists events_created_by_idx on public.events (created_by);

alter table public.events enable row level security;

drop policy if exists "events_select" on public.events;
create policy "events_select" on public.events
  for select using (created_by in (select public.linked_user_ids()));

drop policy if exists "events_insert" on public.events;
create policy "events_insert" on public.events
  for insert with check (created_by = auth.uid());

drop policy if exists "events_update" on public.events;
create policy "events_update" on public.events
  for update using (created_by in (select public.linked_user_ids()))
  with check (created_by in (select public.linked_user_ids()));

drop policy if exists "events_delete" on public.events;
create policy "events_delete" on public.events
  for delete using (created_by in (select public.linked_user_ids()));


-- ====================================================================
-- 3) memories — Anılar
-- ====================================================================
create table if not exists public.memories (
  id            uuid primary key default gen_random_uuid(),
  photo_url     text,                               -- Storage public URL
  date          date not null,
  note          text,
  is_favorite   boolean not null default false,
  location_name text,
  latitude      double precision,
  longitude     double precision,
  created_by    uuid not null default auth.uid()
                  references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now()
);

create index if not exists memories_date_idx on public.memories (date);
create index if not exists memories_created_by_idx on public.memories (created_by);

alter table public.memories enable row level security;

drop policy if exists "memories_select" on public.memories;
create policy "memories_select" on public.memories
  for select using (created_by in (select public.linked_user_ids()));

drop policy if exists "memories_insert" on public.memories;
create policy "memories_insert" on public.memories
  for insert with check (created_by = auth.uid());

drop policy if exists "memories_update" on public.memories;
create policy "memories_update" on public.memories
  for update using (created_by in (select public.linked_user_ids()))
  with check (created_by in (select public.linked_user_ids()));

drop policy if exists "memories_delete" on public.memories;
create policy "memories_delete" on public.memories
  for delete using (created_by in (select public.linked_user_ids()));


-- ====================================================================
-- 4) surprises — Sürprizler
-- ====================================================================
create table if not exists public.surprises (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  content     text not null,
  photo_url   text,                                 -- Storage public URL
  unlock_type text not null
                check (unlock_type in ('date','sad','miss','before_trip')),
  unlock_date date,
  is_opened   boolean not null default false,
  opened_at   timestamptz,
  created_by  uuid not null default auth.uid()
                references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create index if not exists surprises_created_by_idx on public.surprises (created_by);

alter table public.surprises enable row level security;

drop policy if exists "surprises_select" on public.surprises;
create policy "surprises_select" on public.surprises
  for select using (created_by in (select public.linked_user_ids()));

drop policy if exists "surprises_insert" on public.surprises;
create policy "surprises_insert" on public.surprises
  for insert with check (created_by = auth.uid());

-- Güncelleme: partner da açabilsin (is_opened/opened_at değişir)
drop policy if exists "surprises_update" on public.surprises;
create policy "surprises_update" on public.surprises
  for update using (created_by in (select public.linked_user_ids()))
  with check (created_by in (select public.linked_user_ids()));

drop policy if exists "surprises_delete" on public.surprises;
create policy "surprises_delete" on public.surprises
  for delete using (created_by in (select public.linked_user_ids()));


-- ====================================================================
-- 5) love_reasons — Seni sevme sebeplerim (ortak)
-- ====================================================================
create table if not exists public.love_reasons (
  id         uuid primary key default gen_random_uuid(),
  text       text not null,
  created_by uuid not null default auth.uid()
               references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.love_reasons enable row level security;

drop policy if exists "love_reasons_select" on public.love_reasons;
create policy "love_reasons_select" on public.love_reasons
  for select using (created_by in (select public.linked_user_ids()));

drop policy if exists "love_reasons_insert" on public.love_reasons;
create policy "love_reasons_insert" on public.love_reasons
  for insert with check (created_by = auth.uid());

drop policy if exists "love_reasons_update" on public.love_reasons;
create policy "love_reasons_update" on public.love_reasons
  for update using (created_by in (select public.linked_user_ids()))
  with check (created_by in (select public.linked_user_ids()));

drop policy if exists "love_reasons_delete" on public.love_reasons;
create policy "love_reasons_delete" on public.love_reasons
  for delete using (created_by in (select public.linked_user_ids()));


-- ====================================================================
-- 5b) special_days — Bize özel günler (ORTAK, her yıl tekrar eder)
-- ====================================================================
-- Yıldönümü, doğum günleri gibi her yıl tekrar eden günler. Yıl tutulmaz;
-- sadece ay (1-12) ve gün (1-31). Çift ortak görür/düzenler (RLS linked).
create table if not exists public.special_days (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  emoji      text not null default '💕',
  month      int  not null check (month between 1 and 12),
  day        int  not null check (day between 1 and 31),
  created_by uuid not null default auth.uid()
               references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.special_days enable row level security;

drop policy if exists "special_days_select" on public.special_days;
create policy "special_days_select" on public.special_days
  for select using (created_by in (select public.linked_user_ids()));

drop policy if exists "special_days_insert" on public.special_days;
create policy "special_days_insert" on public.special_days
  for insert with check (created_by = auth.uid());

drop policy if exists "special_days_update" on public.special_days;
create policy "special_days_update" on public.special_days
  for update using (created_by in (select public.linked_user_ids()))
  with check (created_by in (select public.linked_user_ids()));

drop policy if exists "special_days_delete" on public.special_days;
create policy "special_days_delete" on public.special_days
  for delete using (created_by in (select public.linked_user_ids()));


-- ====================================================================
-- 6) chat_messages — Feyzi sohbet geçmişi (KİŞİSEL, paylaşılmaz)
-- ====================================================================
-- Her kullanıcının Feyzi sohbeti kendine özeldir; partner göremez.
create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  role       text not null check (role in ('user','assistant')),
  content    text not null,
  mode       text not null default 'normal'
               check (mode in ('normal','moral','plan','ani')),
  user_id    uuid not null default auth.uid()
               references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_user_idx on public.chat_messages (user_id, created_at);

alter table public.chat_messages enable row level security;

drop policy if exists "chat_select" on public.chat_messages;
create policy "chat_select" on public.chat_messages
  for select using (user_id = auth.uid());

drop policy if exists "chat_insert" on public.chat_messages;
create policy "chat_insert" on public.chat_messages
  for insert with check (user_id = auth.uid());

drop policy if exists "chat_delete" on public.chat_messages;
create policy "chat_delete" on public.chat_messages
  for delete using (user_id = auth.uid());


-- ====================================================================
-- 7) Realtime — events ve surprises tablolarını yayına ekle
-- ====================================================================
-- Bir kullanıcı ekleme/güncelleme yaptığında diğerinin ekranı anında
-- güncellensin diye bu tabloları "supabase_realtime" yayınına ekleriz.
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.surprises;
alter publication supabase_realtime add table public.love_reasons;
alter publication supabase_realtime add table public.special_days;
-- (İstersen memories de eklenebilir)
-- alter publication supabase_realtime add table public.memories;


-- ====================================================================
-- 8) Storage Bucket'ları + Politikalar
-- ====================================================================
-- memory-photos: anı fotoğrafları | surprise-media: sürpriz fotoğrafları
-- public = true: <Image> bileşeni public URL ile doğrudan yükleyebilsin
-- diye herkese-okuma açıktır. Yollar rastgele/tahmin edilemezdir.
insert into storage.buckets (id, name, public)
values ('memory-photos', 'memory-photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('surprise-media', 'surprise-media', true)
on conflict (id) do nothing;

-- Yükleme (insert): yalnızca giriş yapmış kullanıcı, kendi adına
drop policy if exists "media_insert" on storage.objects;
create policy "media_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('memory-photos','surprise-media')
    and owner = auth.uid()
  );

-- Güncelleme/silme: yalnızca yükleyenin kendisi
drop policy if exists "media_update" on storage.objects;
create policy "media_update" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('memory-photos','surprise-media')
    and owner = auth.uid()
  );

drop policy if exists "media_delete" on storage.objects;
create policy "media_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('memory-photos','surprise-media')
    and owner = auth.uid()
  );

-- Okuma: bucket public olduğu için public URL ile zaten okunabilir.
-- (Güvenlik için bucket'ı private yapıp signed URL kullanmak istersen
--  aşağıdaki politikayı aç ve buckets.public = false yap.)
-- drop policy if exists "media_select" on storage.objects;
-- create policy "media_select" on storage.objects
--   for select to authenticated
--   using (
--     bucket_id in ('memory-photos','surprise-media')
--     and owner in (select public.linked_user_ids())
--   );


-- ====================================================================
-- 8a) emotion_events — Duygular sekmesi (açlık / sevgi istekleri)
-- ====================================================================
create table if not exists public.emotion_events (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('hungry','love')),
  level       text,                                -- açlık seviyesi (hungry)
  action      text,                                -- sevgi eylemi (love)
  suggestion  text,                                -- yemek önerisi (hungry)
  created_by  uuid not null default auth.uid()
                references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create index if not exists emotion_events_created_by_idx on public.emotion_events (created_by);
create index if not exists emotion_events_type_idx on public.emotion_events (type);
create index if not exists emotion_events_created_at_idx on public.emotion_events (created_at desc);

alter table public.emotion_events enable row level security;

drop policy if exists "emotion_events_select" on public.emotion_events;
create policy "emotion_events_select" on public.emotion_events
  for select using (created_by in (select public.linked_user_ids()));

drop policy if exists "emotion_events_insert" on public.emotion_events;
create policy "emotion_events_insert" on public.emotion_events
  for insert with check (created_by = auth.uid());

drop policy if exists "emotion_events_update" on public.emotion_events;
create policy "emotion_events_update" on public.emotion_events
  for update using (created_by in (select public.linked_user_ids()))
  with check (created_by in (select public.linked_user_ids()));

drop policy if exists "emotion_events_delete" on public.emotion_events;
create policy "emotion_events_delete" on public.emotion_events
  for delete using (created_by in (select public.linked_user_ids()));


-- ====================================================================
-- 8b) FAZ 3 — Uzaktan push: profiles.expo_push_token
-- ====================================================================
-- Her cihaz girişte Expo Push Token'ını buraya yazar; Edge Function
-- send-push bu kolonu okuyup Expo Push API'ye iletir.
alter table public.profiles add column if not exists expo_push_token text;


-- ====================================================================
-- 8c) streak_photos + streaks — Günlük fotoğraf serisi (Streak)
-- ====================================================================
create table if not exists public.streak_photos (
  id          uuid primary key default gen_random_uuid(),
  photo_url   text not null,
  caption     text,
  sent_date   date not null default current_date,
  created_by  uuid not null default auth.uid()
                references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create index if not exists streak_photos_sent_date_idx
  on public.streak_photos (sent_date desc);
create index if not exists streak_photos_created_by_idx
  on public.streak_photos (created_by);
create index if not exists streak_photos_sent_date_user_idx
  on public.streak_photos (sent_date, created_by);

alter table public.streak_photos enable row level security;

drop policy if exists "streak_photos_select" on public.streak_photos;
create policy "streak_photos_select" on public.streak_photos
  for select using (created_by in (select public.linked_user_ids()));

drop policy if exists "streak_photos_insert" on public.streak_photos;
create policy "streak_photos_insert" on public.streak_photos
  for insert with check (created_by = auth.uid());

drop policy if exists "streak_photos_delete" on public.streak_photos;
create policy "streak_photos_delete" on public.streak_photos
  for delete using (created_by = auth.uid());

-- Çift bazlı streak durumu (couple_key = küçük_uuid:büyük_uuid)
create table if not exists public.streaks (
  couple_key          text primary key,
  current_streak      int not null default 0,
  longest_streak      int not null default 0,
  last_completed_date date,
  updated_at          timestamptz not null default now()
);

alter table public.streaks enable row level security;

drop policy if exists "streaks_select" on public.streaks;
create policy "streaks_select" on public.streaks
  for select using (
    exists (
      select 1
      from unnest(string_to_array(couple_key, ':')) as uid
      where uid::uuid in (select public.linked_user_ids())
    )
  );

drop policy if exists "streaks_insert" on public.streaks;
create policy "streaks_insert" on public.streaks
  for insert with check (
    exists (
      select 1
      from unnest(string_to_array(couple_key, ':')) as uid
      where uid::uuid = auth.uid()
    )
  );

drop policy if exists "streaks_update" on public.streaks;
create policy "streaks_update" on public.streaks
  for update using (
    exists (
      select 1
      from unnest(string_to_array(couple_key, ':')) as uid
      where uid::uuid in (select public.linked_user_ids())
    )
  )
  with check (
    exists (
      select 1
      from unnest(string_to_array(couple_key, ':')) as uid
      where uid::uuid in (select public.linked_user_ids())
    )
  );

-- Realtime: partner fotoğraf gönderince anında güncelle
alter publication supabase_realtime add table public.streak_photos;
alter publication supabase_realtime add table public.streaks;

-- Storage: streak-photos bucket
insert into storage.buckets (id, name, public)
values ('streak-photos', 'streak-photos', true)
on conflict (id) do nothing;

drop policy if exists "media_insert" on storage.objects;
create policy "media_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('memory-photos','surprise-media','streak-photos')
    and owner = auth.uid()
  );

drop policy if exists "media_update" on storage.objects;
create policy "media_update" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('memory-photos','surprise-media','streak-photos')
    and owner = auth.uid()
  );

drop policy if exists "media_delete" on storage.objects;
create policy "media_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('memory-photos','surprise-media','streak-photos')
    and owner = auth.uid()
  );


-- ====================================================================
-- 8d) moods — Günlük ruh hali takibi
-- ====================================================================
create table if not exists public.moods (
  id          uuid primary key default gen_random_uuid(),
  mood        text not null
                check (mood in ('mutlu','keyifli','normal','yorgun','uzgun','stresli')),
  emoji       text,
  note        text,
  mood_date   date not null default current_date,
  created_by  uuid not null default auth.uid()
                references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (created_by, mood_date)
);

create index if not exists moods_mood_date_idx on public.moods (mood_date desc);
create index if not exists moods_created_by_idx on public.moods (created_by);

alter table public.moods enable row level security;

drop policy if exists "moods_select" on public.moods;
create policy "moods_select" on public.moods
  for select using (created_by in (select public.linked_user_ids()));

drop policy if exists "moods_insert" on public.moods;
create policy "moods_insert" on public.moods
  for insert with check (created_by = auth.uid());

drop policy if exists "moods_update" on public.moods;
create policy "moods_update" on public.moods
  for update using (created_by = auth.uid())
  with check (created_by = auth.uid());

drop policy if exists "moods_delete" on public.moods;
create policy "moods_delete" on public.moods
  for delete using (created_by = auth.uid());

alter publication supabase_realtime add table public.moods;


-- ====================================================================
-- 8e) bucket_list — Ortak yapılacaklar / hayaller listesi
-- ====================================================================
create table if not exists public.bucket_list (
  id                   uuid primary key default gen_random_uuid(),
  title                text not null,
  description          text,
  category             text not null default 'diger'
                         check (category in ('gezi','yemek','aktivite','hayal','diger')),
  emoji                text,
  is_completed         boolean not null default false,
  completed_at         timestamptz,
  completed_photo_url  text,
  target_date          date,
  created_by           uuid not null default auth.uid()
                         references auth.users(id) on delete cascade,
  created_at           timestamptz not null default now()
);

create index if not exists bucket_list_created_by_idx on public.bucket_list (created_by);
create index if not exists bucket_list_is_completed_idx on public.bucket_list (is_completed);
create index if not exists bucket_list_category_idx on public.bucket_list (category);

alter table public.bucket_list enable row level security;

drop policy if exists "bucket_list_select" on public.bucket_list;
create policy "bucket_list_select" on public.bucket_list
  for select using (created_by in (select public.linked_user_ids()));

drop policy if exists "bucket_list_insert" on public.bucket_list;
create policy "bucket_list_insert" on public.bucket_list
  for insert with check (created_by = auth.uid());

drop policy if exists "bucket_list_update" on public.bucket_list;
create policy "bucket_list_update" on public.bucket_list
  for update using (created_by in (select public.linked_user_ids()))
  with check (created_by in (select public.linked_user_ids()));

drop policy if exists "bucket_list_delete" on public.bucket_list;
create policy "bucket_list_delete" on public.bucket_list
  for delete using (created_by in (select public.linked_user_ids()));

alter publication supabase_realtime add table public.bucket_list;


-- ====================================================================
-- 9) PARTNER EŞLEŞTİRME (iki kullanıcı kaydolduktan SONRA çalıştır)
-- ====================================================================
-- Aşağıdaki kullanıcıların kayıtları geldikten sonra e-postalarını
-- yazıp bu bloğu bir kez çalıştır; iki profili karşılıklı eşler.
--
 do $$
 declare ben uuid; sevgilim uuid;
 begin
   select id into ben      from auth.users where email = 'feyziekar@mail.com';
   select id into sevgilim from auth.users where email = 'basakispekter@mail.com';
   update public.profiles set partner_id = sevgilim where id = ben;
   update public.profiles set partner_id = ben      where id = sevgilim;
 end $$;
