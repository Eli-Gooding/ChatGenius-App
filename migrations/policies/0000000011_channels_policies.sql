-- migrate:up
CREATE POLICY "Users can view public channels"
ON public.channels FOR SELECT
TO authenticated
USING (is_private = false);

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

CREATE POLICY "Users can create channels in their workspaces"
ON public.channels FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.memberships m
        JOIN public.channels c ON c.id = m.channel_id
        WHERE c.workspace_id = workspace_id
        AND m.user_id = auth.uid()
    )
    OR
    created_by = auth.uid() -- Allow workspace creator to create initial channels
);

CREATE POLICY "Channel creators can update their channels"
ON public.channels FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- migrate:down
DROP POLICY IF EXISTS "Users can view public channels" ON public.channels;
DROP POLICY IF EXISTS "Members can view private channels" ON public.channels;
DROP POLICY IF EXISTS "Users can create channels in their workspaces" ON public.channels;
DROP POLICY IF EXISTS "Channel creators can update their channels" ON public.channels; 