-- Allow profile owners to see who follows their share code
CREATE POLICY "Profile owners can see their followers"
  ON public.supporter_follows FOR SELECT
  USING (
    share_code IN (
      SELECT profiles.share_code FROM public.profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Allow users to read basic profile info of people who follow them
CREATE POLICY "Users can read follower profiles"
  ON public.profiles FOR SELECT
  USING (
    id IN (
      SELECT sf.supporter_id FROM public.supporter_follows sf
      WHERE sf.share_code IN (
        SELECT p.share_code FROM public.profiles p WHERE p.id = auth.uid()
      )
    )
  );
