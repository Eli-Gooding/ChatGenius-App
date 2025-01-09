-- Set the role to postgres to ensure we have proper permissions
SET ROLE postgres;

-- Drop existing objects
DROP TABLE IF EXISTS public.reactions CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.memberships CASCADE;
DROP TABLE IF EXISTS public.channels CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING ( bucket_id = 'avatars' );

CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid() = CAST(SPLIT_PART(name, '/', 1) AS uuid)
    );

CREATE POLICY "Users can update their own avatar"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars'
        AND auth.uid() = CAST(SPLIT_PART(name, '/', 1) AS uuid)
    );

CREATE POLICY "Users can delete their own avatar"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars'
        AND auth.uid() = CAST(SPLIT_PART(name, '/', 1) AS uuid)
    );

-- Create tables
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    status TEXT DEFAULT 'online',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.memberships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, channel_id)
);

CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (message_id, user_id, emoji)
);

-- Create indexes
CREATE INDEX messages_channel_id_idx ON public.messages(channel_id);
CREATE INDEX messages_parent_message_id_idx ON public.messages(parent_message_id);
CREATE INDEX reactions_message_id_idx ON public.reactions(message_id);
CREATE INDEX memberships_channel_id_idx ON public.memberships(channel_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Create policies

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Channels policies
CREATE POLICY "Public channels are viewable by everyone"
    ON public.channels FOR SELECT
    USING (NOT is_private OR EXISTS (
        SELECT 1 FROM public.memberships
        WHERE channel_id = id AND user_id = auth.uid()
    ));

CREATE POLICY "Members can insert channels"
    ON public.channels FOR INSERT
    WITH CHECK (true);  -- We'll control this via RPC

-- Memberships policies
CREATE POLICY "Memberships are viewable by channel members"
    ON public.memberships FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.memberships m2
        WHERE m2.channel_id = channel_id AND m2.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage their own memberships"
    ON public.memberships FOR ALL
    USING (user_id = auth.uid());

-- Messages policies
CREATE POLICY "Messages are viewable by channel members"
    ON public.messages FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.memberships
        WHERE channel_id = messages.channel_id AND user_id = auth.uid()
    ));

CREATE POLICY "Channel members can insert messages"
    ON public.messages FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.memberships
        WHERE channel_id = messages.channel_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own messages"
    ON public.messages FOR UPDATE
    USING (user_id = auth.uid());

-- Reactions policies
CREATE POLICY "Reactions are viewable by channel members"
    ON public.reactions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.messages
        JOIN public.memberships ON memberships.channel_id = messages.channel_id
        WHERE messages.id = message_id AND memberships.user_id = auth.uid()
    ));

CREATE POLICY "Channel members can insert reactions"
    ON public.reactions FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.messages
        JOIN public.memberships ON memberships.channel_id = messages.channel_id
        WHERE messages.id = message_id AND memberships.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own reactions"
    ON public.reactions FOR DELETE
    USING (user_id = auth.uid());

-- Functions
CREATE OR REPLACE FUNCTION public.create_channel(
    channel_name TEXT,
    channel_description TEXT DEFAULT NULL,
    is_private BOOLEAN DEFAULT false
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_channel_id UUID;
BEGIN
    -- Insert the new channel
    INSERT INTO public.channels (name, description, is_private)
    VALUES (channel_name, channel_description, is_private)
    RETURNING id INTO new_channel_id;

    -- Make the creator an admin
    INSERT INTO public.memberships (user_id, channel_id, role)
    VALUES (auth.uid(), new_channel_id, 'admin');

    RETURN new_channel_id;
END;
$$;

-- Triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, avatar_url)
    VALUES (
        new.id,
        new.raw_user_meta_data->>'name',
        new.email,
        new.raw_user_meta_data->>'avatar_url'
    );
    RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.memberships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions; 