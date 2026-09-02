-- ====================================================================
-- Migration: Migrate Legacy Public URLs to Relative Storage Paths
-- ====================================================================
-- Strips the full Supabase Storage public URL prefix from existing rows,
-- leaving only the relative storage path (e.g., '123-abc.jpg' or 'user/abc.jpg').
--
-- This is idempotent and non-destructive: only rows starting with 'http'
-- are updated. Future queries can resolve signed URLs on demand using
-- storageService.getSignedPhotoUrl().
-- ====================================================================

-- 1) memories table
UPDATE public.memories
SET photo_url = regexp_replace(
  photo_url,
  '^https?://[^/]+/storage/v1/object/(?:public|sign)/memory-photos/',
  ''
)
WHERE photo_url LIKE 'http%';

-- 2) surprises table (media_url)
UPDATE public.surprises
SET media_url = regexp_replace(
  media_url,
  '^https?://[^/]+/storage/v1/object/(?:public|sign)/surprise-media/',
  ''
)
WHERE media_url LIKE 'http%';

-- 3) streak_photos table (photo_url)
UPDATE public.streak_photos
SET photo_url = regexp_replace(
  photo_url,
  '^https?://[^/]+/storage/v1/object/(?:public|sign)/streak-photos/',
  ''
)
WHERE photo_url LIKE 'http%';
