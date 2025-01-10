-- migrate:up
-- Insert a test admin user (only for development)
INSERT INTO public.users (id, name, email, status)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'Admin User',
    'admin@example.com',
    'active'
);

-- Create a general channel
INSERT INTO public.channels (id, name, description, is_private)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'general',
    'General discussion channel',
    false
);

-- Add admin to general channel
INSERT INTO public.memberships (user_id, channel_id, role)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    'admin'
);

-- migrate:down
TRUNCATE TABLE public.memberships CASCADE;
TRUNCATE TABLE public.channels CASCADE;
TRUNCATE TABLE public.users CASCADE; 