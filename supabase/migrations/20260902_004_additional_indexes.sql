-- ====================================================================
-- Migration: Additional Performance & Security Indexes
-- ====================================================================
-- Audits and ensures high-performance indexes for frequent queries,
-- foreign keys, and RLS lookups across all tables.
-- All operations use IF NOT EXISTS to guarantee idempotency.
-- ====================================================================

-- 1) profiles: partner_id lookup and indexing
CREATE INDEX IF NOT EXISTS idx_profiles_partner_id
  ON public.profiles(partner_id);

-- 2) events: date-based queries (calendar screen)
CREATE INDEX IF NOT EXISTS idx_events_date_created_by
  ON public.events(date, created_by);

-- 3) memories: date ordering and favorite filtering
CREATE INDEX IF NOT EXISTS idx_memories_date_desc
  ON public.memories(date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_memories_is_favorite
  ON public.memories(is_favorite)
  WHERE is_favorite = true;

-- 4) streak_photos: sent_date queries
CREATE INDEX IF NOT EXISTS idx_streak_photos_sent_date
  ON public.streak_photos(sent_date DESC, created_at DESC);

-- 5) pairing_codes: lookup by hash and expiry
CREATE INDEX IF NOT EXISTS idx_pairing_codes_lookup
  ON public.pairing_codes(code_hash, expires_at, used);

-- 6) chat_messages: user ordering for chat screen
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created
  ON public.chat_messages(user_id, created_at ASC);

-- 7) moods: latest mood queries
CREATE INDEX IF NOT EXISTS idx_moods_created_at_desc
  ON public.moods(created_at DESC);
