-- migrate:up
CREATE POLICY "Users can view reactions in their channels"
ON public.reactions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.messages m
        JOIN public.memberships mb ON mb.channel_id = m.channel_id
        WHERE m.id = reactions.message_id
        AND mb.user_id = auth.uid()
    )
);

CREATE POLICY "Members can create reactions in their channels"
ON public.reactions FOR INSERT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.messages m
        JOIN public.memberships mb ON mb.channel_id = m.channel_id
        WHERE m.id = reactions.message_id
        AND mb.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.messages m
        JOIN public.memberships mb ON mb.channel_id = m.channel_id
        WHERE m.id = reactions.message_id
        AND mb.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete their own reactions"
ON public.reactions FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- migrate:down
DROP POLICY IF EXISTS "Users can view reactions in their channels" ON public.reactions;
DROP POLICY IF EXISTS "Members can create reactions in their channels" ON public.reactions;
DROP POLICY IF EXISTS "Users can delete their own reactions" ON public.reactions; 