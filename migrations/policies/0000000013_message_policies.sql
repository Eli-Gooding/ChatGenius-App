-- migrate:up
CREATE POLICY "Users can view messages in their channels"
ON public.messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.memberships
        WHERE channel_id = messages.channel_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Members can create messages in their channels"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.memberships
        WHERE channel_id = messages.channel_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own messages"
ON public.messages FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
ON public.messages FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- migrate:down
DROP POLICY IF EXISTS "Users can view messages in their channels" ON public.messages;
DROP POLICY IF EXISTS "Members can create messages in their channels" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages; 