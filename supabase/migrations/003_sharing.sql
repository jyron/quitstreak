-- Sharing & nudges: allow partners to view shared profiles/checkins and send nudges

-- 1. Nudges table
create table public.nudges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  share_code text not null,
  message text default 'Someone is rooting for you! Time for a check-in?',
  seen boolean default false,
  created_at timestamptz default now()
);

alter table public.nudges enable row level security;

-- Users can read their own nudges
create policy "Users can read own nudges"
  on public.nudges for select
  using (auth.uid() = user_id);

-- Users can update (mark seen) their own nudges
create policy "Users can update own nudges"
  on public.nudges for update
  using (auth.uid() = user_id);

-- Anyone can insert a nudge for an active shared profile
create policy "Anyone can insert nudge for shared profile"
  on public.nudges for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.share_code = nudges.share_code
        and profiles.share_active = true
        and profiles.id = nudges.user_id
    )
  );

-- Index for fast unseen nudge lookups
create index nudges_user_id_seen_idx
  on public.nudges (user_id, seen) where seen = false;

-- 2. Allow public reads of profiles with active share codes
create policy "Anyone can read profile by active share code"
  on public.profiles for select
  using (share_active = true and share_code is not null);

-- 3. Allow public reads of checkins for shared profiles
create policy "Anyone can read checkins for shared profiles"
  on public.checkins for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = checkins.user_id
        and profiles.share_active = true
        and profiles.share_code is not null
    )
  );
