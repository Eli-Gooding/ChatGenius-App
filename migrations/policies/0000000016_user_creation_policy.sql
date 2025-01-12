-- migrate:up
-- Allow authenticated users to create their own record
CREATE POLICY "Enable insert for authenticated users creating their own record"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow the trigger to create users (using SECURITY DEFINER)
CREATE POLICY "Allow trigger to create users"
ON public.users FOR INSERT
TO postgres
WITH CHECK (true);

-- migrate:down
DROP POLICY IF EXISTS "Enable insert for authenticated users creating their own record" ON public.users;
DROP POLICY IF EXISTS "Allow trigger to create users" ON public.users; 