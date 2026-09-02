-- ====================================================================
-- Migration: Private Media Storage
-- ====================================================================
-- Makes all media storage buckets private and adds RLS policies
-- for authenticated access (owner + partner only).
--
-- Previously buckets were public=true with random file paths as the
-- only access control. This migration enforces proper authentication.
-- ====================================================================

-- 1) Make buckets private
UPDATE storage.buckets
SET public = false
WHERE id IN ('memory-photos', 'surprise-media', 'streak-photos');

-- 2) Add SELECT policy: only owner or their linked partner can view files
DROP POLICY IF EXISTS "media_select" ON storage.objects;
CREATE POLICY "media_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('memory-photos', 'surprise-media', 'streak-photos')
    AND (owner) IN (SELECT public.linked_user_ids())
  );

-- 3) Recreate INSERT policy to include all three buckets
DROP POLICY IF EXISTS "media_insert" ON storage.objects;
CREATE POLICY "media_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('memory-photos', 'surprise-media', 'streak-photos')
    AND (owner) = auth.uid()
  );

-- 4) Recreate UPDATE policy
DROP POLICY IF EXISTS "media_update" ON storage.objects;
CREATE POLICY "media_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('memory-photos', 'surprise-media', 'streak-photos')
    AND (owner) = auth.uid()
  );

-- 5) Recreate DELETE policy
DROP POLICY IF EXISTS "media_delete" ON storage.objects;
CREATE POLICY "media_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN ('memory-photos', 'surprise-media', 'streak-photos')
    AND (owner) = auth.uid()
  );
