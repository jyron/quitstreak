-- Remove "Someone brave" / "A supporter" default names.
-- NULL means "no name provided" — the app handles this gracefully.

ALTER TABLE public.profiles ALTER COLUMN display_name DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN display_name SET DEFAULT NULL;

UPDATE public.profiles SET display_name = NULL WHERE display_name = 'Someone brave';
UPDATE public.profiles SET display_name = NULL WHERE display_name = 'A supporter';
