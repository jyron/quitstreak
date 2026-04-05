-- Add sender_name to nudges so the recipient knows who sent encouragement
ALTER TABLE public.nudges ADD COLUMN sender_name text;
