-- migrate:up
CREATE TABLE public.memberships (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    channel_id uuid REFERENCES public.channels(id) ON DELETE CASCADE,
    user_role text DEFAULT 'member',
    joined_at timestamptz DEFAULT now(),
    UNIQUE(user_id, channel_id)
);

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- migrate:down
DROP TABLE IF EXISTS public.memberships; 