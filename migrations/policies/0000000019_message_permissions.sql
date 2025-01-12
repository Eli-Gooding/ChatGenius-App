-- migrate:up
-- Grant basic table permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;

-- migrate:down
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.messages FROM authenticated; 