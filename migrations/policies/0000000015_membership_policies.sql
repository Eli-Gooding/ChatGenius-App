-- migrate:up
-- Allow viewing all memberships (they're just references, actual privacy is at channel level)
CREATE POLICY "Users can view all memberships"
ON public.memberships FOR SELECT
TO authenticated
USING (true);

-- Allow users to join channels
CREATE POLICY "Users can join channels"
ON public.memberships FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id
);

-- Users can leave any channel they're in
CREATE POLICY "Users can leave channels"
ON public.memberships FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Grant basic table permissions to authenticated users
GRANT SELECT, INSERT, DELETE ON public.memberships TO authenticated;

-- migrate:down
DROP POLICY IF EXISTS "Users can view all memberships" ON public.memberships;
DROP POLICY IF EXISTS "Users can join channels" ON public.memberships;
DROP POLICY IF EXISTS "Users can leave channels" ON public.memberships;