-- migrate:up

-- Policy to allow users to view other users in their workspaces
CREATE POLICY view_workspace_users ON public.users
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM memberships m1
            JOIN channels c ON m1.channel_id = c.id
            JOIN memberships m2 ON c.workspace_id = (
                SELECT workspace_id FROM channels c2
                WHERE c2.id = m2.channel_id
            )
            WHERE m1.user_id = auth.uid()
            AND m2.user_id = users.id
        )
    );

-- migrate:down
DROP POLICY IF EXISTS view_workspace_users ON public.users; 