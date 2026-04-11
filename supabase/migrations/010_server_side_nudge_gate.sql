-- Server-side nudge gate
--
-- Previously, nudges were inserted directly from the client with a permissive
-- RLS policy that allowed ANY visitor (authenticated or not) to insert a nudge
-- for any active share_code. The "first nudge is free, then paywall" rule lived
-- in localStorage on the client — trivially bypassed.
--
-- This migration:
-- 1. Adds free_nudge_used to supporter_follows (per-supporter, per-addict)
-- 2. Creates a SECURITY DEFINER RPC `send_nudge` that enforces:
--    - Must be authenticated
--    - Must have (or auto-create) a supporter_follows row
--    - Non-subscribers get exactly 1 free nudge per addict, then paywall
--    - Subscribers get unlimited
-- 3. Tightens the nudges INSERT policy so direct inserts require a matching
--    follow row (defense-in-depth — the RPC is the canonical path)

-- 1. Add free_nudge_used flag to the follow relationship
ALTER TABLE public.supporter_follows
  ADD COLUMN IF NOT EXISTS free_nudge_used boolean NOT NULL DEFAULT false;

-- 2. The canonical nudge-sending RPC
CREATE OR REPLACE FUNCTION public.send_nudge(
  p_share_code text,
  p_sender_name text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id     uuid := auth.uid();
  v_target_id   uuid;
  v_free_used   boolean;
  v_sub_status  text;
BEGIN
  -- Must be signed in
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'signup');
  END IF;

  -- Target profile must exist and be actively sharing
  SELECT id INTO v_target_id
  FROM public.profiles
  WHERE share_code = p_share_code AND share_active = true;

  IF v_target_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  -- Don't let addicts nudge themselves
  IF v_target_id = v_user_id THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'self');
  END IF;

  -- Ensure a follow row exists (idempotent)
  INSERT INTO public.supporter_follows (supporter_id, share_code)
  VALUES (v_user_id, p_share_code)
  ON CONFLICT (supporter_id, share_code) DO NOTHING;

  SELECT free_nudge_used INTO v_free_used
  FROM public.supporter_follows
  WHERE supporter_id = v_user_id AND share_code = p_share_code;

  -- Sender subscription status
  SELECT subscription_status INTO v_sub_status
  FROM public.profiles
  WHERE id = v_user_id;

  -- Paywall: non-subscribers who already used their free nudge
  IF v_sub_status NOT IN ('active', 'canceled') AND v_free_used THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'paywall');
  END IF;

  -- Insert the nudge (SECURITY DEFINER bypasses RLS)
  INSERT INTO public.nudges (user_id, share_code, sender_name)
  VALUES (v_target_id, p_share_code, p_sender_name);

  -- Burn the free nudge for non-subscribers
  IF v_sub_status NOT IN ('active', 'canceled') AND NOT v_free_used THEN
    UPDATE public.supporter_follows
    SET free_nudge_used = true
    WHERE supporter_id = v_user_id AND share_code = p_share_code;
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Only authenticated users can call it
REVOKE ALL ON FUNCTION public.send_nudge(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_nudge(text, text) TO authenticated;

-- 3. Tighten nudges INSERT policy
-- Drop the old permissive "anyone can insert" rule
DROP POLICY IF EXISTS "Anyone can insert nudge for shared profile" ON public.nudges;

-- New: direct inserts require an existing follow row (the RPC still bypasses
-- this via SECURITY DEFINER, so the app keeps working). Anonymous clients
-- are now completely blocked.
CREATE POLICY "Authenticated supporters can insert nudges"
  ON public.nudges FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.supporter_follows sf
      WHERE sf.supporter_id = auth.uid()
        AND sf.share_code = nudges.share_code
    )
  );
