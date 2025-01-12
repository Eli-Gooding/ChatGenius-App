-- migrate:up
CREATE TABLE public.files (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    channel_id uuid REFERENCES public.channels(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    file_name text NOT NULL,
    file_size bigint NOT NULL,
    mime_type text,
    storage_path text NOT NULL,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Channel members can view files
CREATE POLICY "Channel members can view files"
ON public.files FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM memberships
        WHERE channel_id = files.channel_id
        AND user_id = auth.uid()
    )
);

-- Channel members can upload files
CREATE POLICY "Channel members can upload files"
ON public.files FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM memberships
        WHERE channel_id = files.channel_id
        AND user_id = auth.uid()
    )
);

-- File owners can delete their files
CREATE POLICY "File owners can delete their files"
ON public.files FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Grant necessary permissions
GRANT SELECT, INSERT, DELETE ON public.files TO authenticated;

-- Create index for faster lookups
CREATE INDEX idx_files_channel_id ON public.files(channel_id);

-- migrate:down
DROP TABLE IF EXISTS public.files CASCADE; 