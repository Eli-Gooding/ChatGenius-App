-- migrate:up
ALTER TABLE public.memberships
    ADD CONSTRAINT memberships_role_check 
    CHECK (user_role IN ('admin', 'member'));

-- migrate:down
ALTER TABLE public.memberships
    DROP CONSTRAINT IF EXISTS memberships_role_check; 