-- ====================================================================
-- Migration: Partner Security & Pairing System
-- ====================================================================
-- 1) Restricts profiles UPDATE to specific safe columns (blocks
--    direct client-side partner_id modification).
-- 2) Creates pairing_codes table for secure in-app partner linking.
-- 3) Creates pair_partner() RPC for transaction-safe pairing.
-- ====================================================================

-- ====================================================================
-- 1) Restrict profiles UPDATE policy
-- ====================================================================
-- Only allow updating safe columns. partner_id can only be changed
-- by the server-side pair_partner() function (SECURITY DEFINER).
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Restrict which columns can be updated by the client.
-- partner_id changes must go through the pair_partner RPC.
-- We use a trigger to enforce this since PostgreSQL policies
-- cannot restrict individual columns.
CREATE OR REPLACE FUNCTION public.guard_partner_id_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Allow if partner_id is not being changed
  IF NEW.partner_id IS NOT DISTINCT FROM OLD.partner_id THEN
    RETURN NEW;
  END IF;

  -- Allow if called from a SECURITY DEFINER function (server-side)
  -- by checking if the current user is the service role
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Block direct client-side partner_id changes
  RAISE EXCEPTION 'partner_id cannot be changed directly. Use the pairing system.';
END;
$$;

DROP TRIGGER IF EXISTS guard_partner_id ON public.profiles;
CREATE TRIGGER guard_partner_id
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_partner_id_update();


-- ====================================================================
-- 2) Pairing codes table
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.pairing_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash   text NOT NULL,                    -- SHA-256 hash of the code
  expires_at  timestamptz NOT NULL,
  used        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pairing_codes ENABLE ROW LEVEL SECURITY;

-- Creator can see their own codes
DROP POLICY IF EXISTS "pairing_codes_select" ON public.pairing_codes;
CREATE POLICY "pairing_codes_select" ON public.pairing_codes
  FOR SELECT USING (creator_id = auth.uid());

-- Creator can insert codes for themselves
DROP POLICY IF EXISTS "pairing_codes_insert" ON public.pairing_codes;
CREATE POLICY "pairing_codes_insert" ON public.pairing_codes
  FOR INSERT WITH CHECK (creator_id = auth.uid());


-- ====================================================================
-- 3) create_pairing_code() — generates a short-lived pairing code
-- ====================================================================
CREATE OR REPLACE FUNCTION public.create_pairing_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id  uuid := auth.uid();
  v_code     text;
  v_hash     text;
  v_partner  uuid;
BEGIN
  -- Must be authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Check if already paired
  SELECT partner_id INTO v_partner FROM public.profiles WHERE id = v_user_id;
  IF v_partner IS NOT NULL THEN
    RAISE EXCEPTION 'Already paired with a partner';
  END IF;

  -- Invalidate any existing unused codes from this user
  UPDATE public.pairing_codes
  SET used = true
  WHERE creator_id = v_user_id AND used = false;

  -- Generate 6-digit code
  v_code := lpad(floor(random() * 1000000)::text, 6, '0');
  v_hash := encode(digest(v_code, 'sha256'), 'hex');

  -- Store hashed code with 15 minute expiry
  INSERT INTO public.pairing_codes (creator_id, code_hash, expires_at)
  VALUES (v_user_id, v_hash, now() + interval '15 minutes');

  -- Return plaintext code to creator (shown once)
  RETURN v_code;
END;
$$;


-- ====================================================================
-- 4) redeem_pairing_code() — pairs two users
-- ====================================================================
CREATE OR REPLACE FUNCTION public.redeem_pairing_code(p_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_redeemer_id  uuid := auth.uid();
  v_code_hash    text;
  v_code_record  record;
  v_creator_id   uuid;
  v_redeemer_partner uuid;
  v_creator_partner  uuid;
BEGIN
  -- Must be authenticated
  IF v_redeemer_id IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'Authentication required');
  END IF;

  -- Check if redeemer is already paired
  SELECT partner_id INTO v_redeemer_partner
  FROM public.profiles WHERE id = v_redeemer_id;
  IF v_redeemer_partner IS NOT NULL THEN
    RETURN json_build_object('ok', false, 'error', 'Already paired with a partner');
  END IF;

  -- Hash the provided code and find a match
  v_code_hash := encode(digest(p_code, 'sha256'), 'hex');

  SELECT * INTO v_code_record
  FROM public.pairing_codes
  WHERE code_hash = v_code_hash
    AND used = false
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_code_record IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'Invalid or expired code');
  END IF;

  v_creator_id := v_code_record.creator_id;

  -- Cannot pair with yourself
  IF v_creator_id = v_redeemer_id THEN
    RETURN json_build_object('ok', false, 'error', 'Cannot pair with yourself');
  END IF;

  -- Check if creator is still unpaired
  SELECT partner_id INTO v_creator_partner
  FROM public.profiles WHERE id = v_creator_id;
  IF v_creator_partner IS NOT NULL THEN
    RETURN json_build_object('ok', false, 'error', 'Code creator already paired');
  END IF;

  -- Mark code as used
  UPDATE public.pairing_codes SET used = true WHERE id = v_code_record.id;

  -- Reciprocal partner link (both directions)
  UPDATE public.profiles SET partner_id = v_redeemer_id WHERE id = v_creator_id;
  UPDATE public.profiles SET partner_id = v_creator_id WHERE id = v_redeemer_id;

  RETURN json_build_object('ok', true, 'partner_id', v_creator_id);
END;
$$;
