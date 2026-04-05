-- Supporter follows: persist which share codes a supporter is tracking

CREATE TABLE public.supporter_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supporter_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  share_code text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(supporter_id, share_code)
);

ALTER TABLE public.supporter_follows ENABLE ROW LEVEL SECURITY;

-- Supporters can read their own follows
CREATE POLICY "Supporters can read own follows"
  ON public.supporter_follows FOR SELECT
  USING (auth.uid() = supporter_id);

-- Supporters can insert their own follows (only for active share codes)
CREATE POLICY "Supporters can insert own follows"
  ON public.supporter_follows FOR INSERT
  WITH CHECK (
    auth.uid() = supporter_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.share_code = supporter_follows.share_code
        AND profiles.share_active = true
    )
  );

-- Supporters can delete their own follows
CREATE POLICY "Supporters can delete own follows"
  ON public.supporter_follows FOR DELETE
  USING (auth.uid() = supporter_id);

-- Index for fast lookups by supporter
CREATE INDEX supporter_follows_supporter_id_idx
  ON public.supporter_follows (supporter_id, created_at DESC);
