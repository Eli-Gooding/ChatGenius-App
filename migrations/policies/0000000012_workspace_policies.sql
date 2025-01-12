-- migrate:up
-- Allow authenticated users to view all workspaces
CREATE POLICY "Enable read access for authenticated users"
ON public.workspaces FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to create workspaces
CREATE POLICY "Enable insert for authenticated users"
ON public.workspaces FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only workspace creators can update their workspaces
CREATE POLICY "Enable update for workspace creators"
ON public.workspaces FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Only workspace creators can delete their workspaces
CREATE POLICY "Enable delete for workspace creators"
ON public.workspaces FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- migrate:down
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.workspaces;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.workspaces;
DROP POLICY IF EXISTS "Enable update for workspace creators" ON public.workspaces;
DROP POLICY IF EXISTS "Enable delete for workspace creators" ON public.workspaces; 