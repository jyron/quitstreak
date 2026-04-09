-- Fix infinite recursion in profiles RLS policies introduced by 008_my_supporters.sql
--
-- Root cause: "Users can read follower profiles" policy on profiles queries profiles
-- in its subquery, which triggers the same policy → infinite recursion.
-- Same issue in "Profile owners can see their followers" on supporter_follows.
--
-- Fix: use a SECURITY DEFINER function to fetch the current user's share_code
-- without going through RLS, breaking the cycle.

CREATE OR REPLACE FUNCTION public.get_current_user_share_code()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT share_code FROM public.profiles WHERE id = auth.uid();
$$;

-- Fix supporter_follows policy (queries profiles → triggered profiles RLS → recursion)
DROP POLICY IF EXISTS "Profile owners can see their followers" ON public.supporter_follows;
CREATE POLICY "Profile owners can see their followers"
  ON public.supporter_follows FOR SELECT
  USING (
    share_code = public.get_current_user_share_code()
  );

-- Fix profiles policy (queries profiles inside a profiles policy → recursion)
DROP POLICY IF EXISTS "Users can read follower profiles" ON public.profiles;
CREATE POLICY "Users can read follower profiles"
  ON public.profiles FOR SELECT
  USING (
    id IN (
      SELECT sf.supporter_id
      FROM public.supporter_follows sf
      WHERE sf.share_code = public.get_current_user_share_code()
    )
  );
