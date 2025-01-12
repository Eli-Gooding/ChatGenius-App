-- migrate:up

-- Policy to allow users to create DM channels with other users in their workspace
CREATE POLICY create_dm_channels ON public.channels
    FOR INSERT
    TO authenticated
    WITH CHECK (
        is_private = true
        AND channel_name LIKE 'dm_%'
        AND EXISTS (
            SELECT 1 FROM memberships m
            JOIN channels c ON m.channel_id = c.id
            WHERE m.user_id = auth.uid()
            AND c.workspace_id = channels.workspace_id
        )
    );

-- Policy to allow users to view their own DM channels
CREATE POLICY view_dm_channels ON public.channels
    FOR SELECT
    TO authenticated
    USING (
        is_private = true
        AND channel_name LIKE 'dm_%'
        AND EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.channel_id = channels.id
            AND m.user_id = auth.uid()
        )
    );

-- migrate:down
DROP POLICY IF EXISTS create_dm_channels ON public.channels;
DROP POLICY IF EXISTS view_dm_channels ON public.channels; 