-- migrate:up
-- Anyone can view public channels
CREATE POLICY "Users can view public channels"
ON public.channels FOR SELECT
TO authenticated
USING (is_private = false);

-- Members can view private channels
CREATE POLICY "Members can view private channels"
ON public.channels FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM memberships
        WHERE channel_id = id
        AND user_id = auth.uid()
    )
);

-- Anyone can create channels (workspace validation in application)
CREATE POLICY "Users can create channels in workspaces"
ON public.channels FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only creators can update their channels
CREATE POLICY "Channel creators can update their channels"
ON public.channels FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Grant basic table permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.channels TO authenticated;

-- migrate:down
DROP POLICY IF EXISTS "Users can view public channels" ON public.channels;
DROP POLICY IF EXISTS "Members can view private channels" ON public.channels;
DROP POLICY IF EXISTS "Users can create channels in workspaces" ON public.channels;
DROP POLICY IF EXISTS "Channel creators can update their channels" ON public.channels; 
