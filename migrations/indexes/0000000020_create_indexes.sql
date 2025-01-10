-- migrate:up
CREATE INDEX idx_messages_channel_id ON public.messages(channel_id);
CREATE INDEX idx_memberships_channel_user ON public.memberships(channel_id, user_id);
CREATE INDEX idx_reactions_message_id ON public.reactions(message_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_parent_id ON public.messages(parent_message_id);

-- migrate:down
DROP INDEX IF EXISTS idx_messages_channel_id;
DROP INDEX IF EXISTS idx_memberships_channel_user;
DROP INDEX IF EXISTS idx_reactions_message_id;
DROP INDEX IF EXISTS idx_messages_created_at;
DROP INDEX IF EXISTS idx_messages_parent_id; 