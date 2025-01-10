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

CREATE POLICY "Admins can create channels"
ON public.channels FOR INSERT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM memberships
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

CREATE POLICY "Channel admins can update channels"
ON public.channels FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM memberships
        WHERE channel_id = id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
);

-- migrate:down
DROP POLICY IF EXISTS "Users can view public channels" ON public.channels;
DROP POLICY IF EXISTS "Members can view private channels" ON public.channels;
DROP POLICY IF EXISTS "Admins can create channels" ON public.channels;
DROP POLICY IF EXISTS "Channel admins can update channels" ON public.channels; 