-- Patch RLS for admin access (forevercrab321@gmail.com)

-- 1. Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
  (SELECT email FROM auth.users WHERE auth.users.id = auth.uid()) = 'forevercrab321@gmail.com'
  OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 2. Allow admins to view all deals (Fixes the PGRST116 Error)
CREATE POLICY "Admins can view all deals"
ON public.deals FOR SELECT
USING (
  (SELECT email FROM auth.users WHERE auth.users.id = auth.uid()) = 'forevercrab321@gmail.com'
  OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 3. Allow admins to view all reports
CREATE POLICY "Admins can view all reports"
ON public.reports FOR SELECT
USING (
  (SELECT email FROM auth.users WHERE auth.users.id = auth.uid()) = 'forevercrab321@gmail.com'
  OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
