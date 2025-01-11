-- migrate:up
CREATE TABLE public.channels (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    channel_name text NOT NULL,
    channel_description text,
    is_private boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- migrate:down
DROP TABLE IF EXISTS public.channels; 