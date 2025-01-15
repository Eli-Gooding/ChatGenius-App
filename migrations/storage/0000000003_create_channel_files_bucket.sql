-- Create a private storage bucket for channel files
INSERT INTO storage.buckets (id, name)
VALUES ('channel-files', 'channel-files')
ON CONFLICT DO NOTHING;

-- Allow authenticated users to upload files to channels they are members of
CREATE POLICY "Channel members can upload files"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'channel-files'
        AND (
            -- Extract channel_id from path (format: channel_id/filename)
            auth.uid() IN (
                SELECT user_id
                FROM public.memberships
                WHERE channel_id = (SPLIT_PART(storage.objects.name, '/', 1))::uuid
            )
        )
    );

-- Allow channel members to read files from their channels
CREATE POLICY "Channel members can read files"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'channel-files'
        AND (
            -- Extract channel_id from path
            auth.uid() IN (
                SELECT user_id
                FROM public.memberships
                WHERE channel_id = (SPLIT_PART(storage.objects.name, '/', 1))::uuid
            )
        )
    );

-- Allow users to delete their own uploaded files or if they are channel admin
CREATE POLICY "Users can delete their own files or if admin"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'channel-files'
        AND (
            -- Check if user is the uploader or a channel admin
            auth.uid() = owner
            OR auth.uid() IN (
                SELECT user_id
                FROM public.memberships
                WHERE channel_id = (SPLIT_PART(storage.objects.name, '/', 1))::uuid
                AND user_role = 'admin'
            )
        )
    ); 