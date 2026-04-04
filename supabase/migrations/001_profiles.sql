-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text not null default 'Someone brave',
  quit_type text not null check (quit_type in ('drinking', 'smoking', 'vaping')),
  quit_date timestamptz not null default now(),
  daily_spend decimal(10,2) default 0,
  daily_amount integer default 0,
  subscription_status text not null default 'free' check (subscription_status in ('free', 'active', 'canceled', 'past_due')),
  stripe_customer_id text,
  share_code text unique,
  share_active boolean default true,
  reminder_time time default '09:00',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can insert their own profile (during onboarding)
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();
