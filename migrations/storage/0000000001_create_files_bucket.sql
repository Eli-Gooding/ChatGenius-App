-- Create storage bucket for channel files
INSERT INTO storage.buckets (id, name, public)
VALUES ('channel-files', 'channel-files', false);

-- Allow authenticated users to upload files to workspaces they belong to
CREATE POLICY "Users can upload files to their workspaces"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'channel-files' AND
    EXISTS (
        SELECT 1 FROM public.workspace_users wu
        WHERE wu.workspace_id::text = (storage.foldername(name))[1]
        AND wu.user_id = auth.uid()
    )
);

-- Allow authenticated users to read files from their workspaces
CREATE POLICY "Users can read files from their workspaces"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'channel-files' AND
    EXISTS (
        SELECT 1 FROM public.workspace_users wu
        WHERE wu.workspace_id::text = (storage.foldername(name))[1]
        AND wu.user_id = auth.uid()
    )
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'channel-files' AND
    owner_id = auth.uid()
); 