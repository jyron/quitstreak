-- Check-ins table
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  mood integer not null check (mood between 1 and 5),
  craving integer not null check (craving between 1 and 5),
  note varchar(280),
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.checkins enable row level security;

-- Users can read their own check-ins
create policy "Users can read own checkins"
  on public.checkins for select
  using (auth.uid() = user_id);

-- Users can insert their own check-ins
create policy "Users can insert own checkins"
  on public.checkins for insert
  with check (auth.uid() = user_id);

-- Users can update their own check-ins
create policy "Users can update own checkins"
  on public.checkins for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own check-ins
create policy "Users can delete own checkins"
  on public.checkins for delete
  using (auth.uid() = user_id);

-- Index for fast lookups by user and date
create index checkins_user_id_created_at_idx
  on public.checkins (user_id, created_at desc);
