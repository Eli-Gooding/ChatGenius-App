-- migrate:up
-- Allow viewing all memberships (they're just references, actual privacy is at channel level)
CREATE POLICY "Users can view all memberships"
ON public.memberships FOR SELECT
TO authenticated
USING (true);

-- Allow users to join public channels
CREATE POLICY "Users can join public channels"
ON public.memberships FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.channels
        WHERE id = channel_id
        AND is_private = false
    )
);

-- Channel creators can add members to private channels
CREATE POLICY "Channel creators can add members"
ON public.memberships FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.channels
        WHERE id = channel_id
        AND created_by = auth.uid()
    )
);

-- Users can leave any channel they're in
CREATE POLICY "Users can leave channels"
ON public.memberships FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- migrate:down
DROP POLICY IF EXISTS "Users can view all memberships" ON public.memberships;
DROP POLICY IF EXISTS "Users can join public channels" ON public.memberships;
DROP POLICY IF EXISTS "Channel creators can add members" ON public.memberships;
DROP POLICY IF EXISTS "Users can leave channels" ON public.memberships;