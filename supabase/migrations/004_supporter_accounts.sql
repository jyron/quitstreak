-- Supporter accounts: allow users who don't have a quitting journey of their own

-- Supporters don't track a substance, so quit_type can be null for them
ALTER TABLE public.profiles ALTER COLUMN quit_type DROP NOT NULL;

-- account_type distinguishes supporters from addicts
-- 'addict'   = tracking their own quitting journey
-- 'supporter' = no personal journey; watching and encouraging someone else
-- Someone who does both is 'addict' (they have a journey AND can view partner dashboards)
ALTER TABLE public.profiles
  ADD COLUMN account_type text NOT NULL DEFAULT 'addict'
  CHECK (account_type IN ('addict', 'supporter'));
