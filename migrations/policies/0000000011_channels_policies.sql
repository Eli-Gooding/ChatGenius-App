-- migrate:up
-- Anyone can view public channels
CREATE POLICY "Users can view public channels"
ON public.channels FOR SELECT
TO authenticated
USING (is_private = false);

-- Members can view private channels (using the now-visible memberships)
CREATE POLICY "Members can view private channels"
ON public.channels FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM memberships
        WHERE channel_id = id
        AND user_id = auth.uid()
    )
    OR created_by = auth.uid()
);

-- Anyone can create channels (workspace validation in application)
CREATE POLICY "Users can create channels"
ON public.channels FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only creators can update their channels
CREATE POLICY "Channel creators can update their channels"
ON public.channels FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- migrate:down
DROP POLICY IF EXISTS "Users can view public channels" ON public.channels;
DROP POLICY IF EXISTS "Members can view private channels" ON public.channels;
DROP POLICY IF EXISTS "Users can create channels" ON public.channels;
DROP POLICY IF EXISTS "Channel creators can update their channels" ON public.channels; 
