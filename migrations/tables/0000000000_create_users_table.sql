-- migrate:up
CREATE TABLE public.users (
    id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
    user_name text,
    email text,
    user_status text CHECK (user_status IN ('online', 'away', 'offline')) DEFAULT 'offline',
    last_active_at timestamptz,
    avatar_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- migrate:down
DROP TABLE IF EXISTS public.users; 