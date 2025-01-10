-- migrate:up
CREATE TABLE public.users (
    id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
    user_name text,
    email text,
    presence text,
    user_status text,
    avatar_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- migrate:down
DROP TABLE IF EXISTS public.users; 