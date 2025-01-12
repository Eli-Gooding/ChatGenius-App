-- migrate:up
-- Create files bucket if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'channel-files'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('channel-files', 'channel-files', false);
    END IF;
END $$;

-- Set up storage policies for files bucket
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Channel members can view files'
    ) THEN
        CREATE POLICY "Channel members can view files"
        ON storage.objects FOR SELECT
        USING (
            bucket_id = 'channel-files' AND
            EXISTS (
                SELECT 1 FROM public.memberships m
                WHERE m.user_id = auth.uid()
                AND m.channel_id = (storage.foldername(name))[1]::uuid
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Channel members can upload files'
    ) THEN
        CREATE POLICY "Channel members can upload files"
        ON storage.objects FOR INSERT
        WITH CHECK (
            bucket_id = 'channel-files' AND
            EXISTS (
                SELECT 1 FROM public.memberships m
                WHERE m.user_id = auth.uid()
                AND m.channel_id = (storage.foldername(name))[1]::uuid
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Channel members can delete files'
    ) THEN
        CREATE POLICY "Channel members can delete files"
        ON storage.objects FOR DELETE
        USING (
            bucket_id = 'channel-files' AND
            EXISTS (
                SELECT 1 FROM public.memberships m
                WHERE m.user_id = auth.uid()
                AND m.channel_id = (storage.foldername(name))[1]::uuid
            )
        );
    END IF;
END $$;

-- migrate:down
DROP POLICY IF EXISTS "Channel members can view files" ON storage.objects;
DROP POLICY IF EXISTS "Channel members can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Channel members can delete files" ON storage.objects;
DELETE FROM storage.buckets WHERE id = 'channel-files'; 