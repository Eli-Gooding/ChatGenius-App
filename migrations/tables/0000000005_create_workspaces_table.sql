-- migrate:up
CREATE TABLE public.workspaces (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_name text NOT NULL,
    workspace_description text,
    created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- migrate:down
DROP TABLE IF EXISTS public.workspaces; 