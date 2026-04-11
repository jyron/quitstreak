-- Gift-a-supporter subscriptions
--
-- Allows an addict to pay for a subscription on behalf of a supporter (e.g. their
-- spouse, parent, or friend). The gifter's Stripe customer holds the subscription;
-- the recipient is tracked by email (since they may not have signed up yet).
--
-- When a supporter has an ACTIVE gifted subscription, they're treated as subscribed
-- for the purposes of sending nudges — even if their own profiles.subscription_status
-- is 'free'.

-- 1. Table
CREATE TABLE public.gifted_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_customer_id text,                                       -- the gifter's customer
  gifter_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,                                 -- stored lowercase
  recipient_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'canceled', 'past_due', 'free')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX gifted_subs_recipient_email_idx
  ON public.gifted_subscriptions (recipient_email, status);
CREATE INDEX gifted_subs_recipient_user_id_idx
  ON public.gifted_subscriptions (recipient_user_id, status);
CREATE INDEX gifted_subs_gifter_idx
  ON public.gifted_subscriptions (gifter_user_id);

CREATE TRIGGER gifted_subscriptions_updated_at
  BEFORE UPDATE ON public.gifted_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 2. RLS — users can see gifts where they are the gifter or matched recipient.
-- All writes go through the webhook using the service role, so no write policies.
ALTER TABLE public.gifted_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read gifts they gave or received"
  ON public.gifted_subscriptions FOR SELECT
  USING (
    auth.uid() = gifter_user_id
    OR auth.uid() = recipient_user_id
  );

-- 3. Effective-subscription helper (SECURITY DEFINER so it can hit auth.users)
CREATE OR REPLACE FUNCTION public.is_user_effectively_subscribed(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_email  text;
  v_has_gift boolean;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Personal subscription?
  SELECT subscription_status INTO v_status
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_status IN ('active', 'canceled') THEN
    RETURN true;
  END IF;

  -- Gift via linked user_id or raw email match?
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;

  SELECT EXISTS (
    SELECT 1 FROM public.gifted_subscriptions
    WHERE status IN ('active', 'canceled')
      AND (
        recipient_user_id = p_user_id
        OR (v_email IS NOT NULL AND lower(recipient_email) = lower(v_email))
      )
  ) INTO v_has_gift;

  RETURN v_has_gift;
END;
$$;

REVOKE ALL ON FUNCTION public.is_user_effectively_subscribed(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_user_effectively_subscribed(uuid) TO authenticated;

-- 4a. Helper for the webhook to find a profile id by email (service role only).
-- Using a SECURITY DEFINER function avoids granting the service role broad auth
-- table access.
CREATE OR REPLACE FUNCTION public.lookup_profile_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM auth.users WHERE lower(email) = lower(p_email) LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.lookup_profile_id_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_profile_id_by_email(text) TO service_role;

-- 4b. Backfill trigger: when a new profile is created (or an email-less row gets
-- updated), link any pending gifts for that user's email.
CREATE OR REPLACE FUNCTION public.link_gifted_subscriptions_to_new_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.id;
  IF v_email IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.gifted_subscriptions
  SET recipient_user_id = NEW.id
  WHERE recipient_user_id IS NULL
    AND lower(recipient_email) = lower(v_email);

  RETURN NEW;
END;
$$;

CREATE TRIGGER link_gifted_subscriptions_on_profile_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.link_gifted_subscriptions_to_new_profile();

-- 5. Update send_nudge RPC to consider gifted subscriptions
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
  v_is_subbed   boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'signup');
  END IF;

  SELECT id INTO v_target_id
  FROM public.profiles
  WHERE share_code = p_share_code AND share_active = true;

  IF v_target_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  IF v_target_id = v_user_id THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'self');
  END IF;

  INSERT INTO public.supporter_follows (supporter_id, share_code)
  VALUES (v_user_id, p_share_code)
  ON CONFLICT (supporter_id, share_code) DO NOTHING;

  SELECT free_nudge_used INTO v_free_used
  FROM public.supporter_follows
  WHERE supporter_id = v_user_id AND share_code = p_share_code;

  -- Effective subscription (personal OR gifted)
  v_is_subbed := public.is_user_effectively_subscribed(v_user_id);

  IF NOT v_is_subbed AND v_free_used THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'paywall');
  END IF;

  INSERT INTO public.nudges (user_id, share_code, sender_name)
  VALUES (v_target_id, p_share_code, p_sender_name);

  IF NOT v_is_subbed AND NOT v_free_used THEN
    UPDATE public.supporter_follows
    SET free_nudge_used = true
    WHERE supporter_id = v_user_id AND share_code = p_share_code;
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;
