-- migrate:up
CREATE POLICY "Users can view workspaces they are members of"
ON public.workspaces FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.channels c
        JOIN public.memberships m ON m.channel_id = c.id
        WHERE c.workspace_id = workspaces.id
        AND m.user_id = auth.uid()
    )
);

CREATE POLICY "Users can create workspaces"
ON public.workspaces FOR INSERT
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Workspace creators can update their workspaces"
ON public.workspaces FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Workspace creators can delete their workspaces"
ON public.workspaces FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- migrate:down
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON public.workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Workspace creators can update their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Workspace creators can delete their workspaces" ON public.workspaces; 