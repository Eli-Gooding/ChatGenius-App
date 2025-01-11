-- migrate:up
ALTER TABLE public.channels
    ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
    ADD COLUMN created_by uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- migrate:down
ALTER TABLE public.channels
    DROP COLUMN IF EXISTS workspace_id,
    DROP COLUMN IF EXISTS created_by; 