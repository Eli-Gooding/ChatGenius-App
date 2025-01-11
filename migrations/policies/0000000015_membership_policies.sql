-- migrate:up
CREATE POLICY "Users can view memberships in their channels"
ON public.memberships FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.memberships m2
        WHERE m2.channel_id = memberships.channel_id
        AND m2.user_id = auth.uid()
    )
);

CREATE POLICY "Channel admins can create memberships"
ON public.memberships FOR INSERT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.memberships
        WHERE channel_id = memberships.channel_id
        AND user_id = auth.uid()
        AND user_role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.memberships
        WHERE channel_id = memberships.channel_id
        AND user_id = auth.uid()
        AND user_role = 'admin'
    )
);

CREATE POLICY "Channel admins can update memberships"
ON public.memberships FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.memberships
        WHERE channel_id = memberships.channel_id
        AND user_id = auth.uid()
        AND user_role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.memberships
        WHERE channel_id = memberships.channel_id
        AND user_id = auth.uid()
        AND user_role = 'admin'
    )
);

CREATE POLICY "Channel admins can delete memberships"
ON public.memberships FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.memberships
        WHERE channel_id = memberships.channel_id
        AND user_id = auth.uid()
        AND user_role = 'admin'
    )
);

CREATE POLICY "Users can leave channels"
ON public.memberships FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- migrate:down
DROP POLICY IF EXISTS "Users can view memberships in their channels" ON public.memberships;
DROP POLICY IF EXISTS "Channel admins can create memberships" ON public.memberships;
DROP POLICY IF EXISTS "Channel admins can update memberships" ON public.memberships;
DROP POLICY IF EXISTS "Channel admins can delete memberships" ON public.memberships;
DROP POLICY IF EXISTS "Users can leave channels" ON public.memberships; 