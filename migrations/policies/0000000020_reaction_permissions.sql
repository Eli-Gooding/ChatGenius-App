-- migrate:up
-- Grant basic table permissions to authenticated users
GRANT SELECT, INSERT, DELETE ON public.reactions TO authenticated;

-- migrate:down
REVOKE SELECT, INSERT, DELETE ON public.reactions FROM authenticated; 