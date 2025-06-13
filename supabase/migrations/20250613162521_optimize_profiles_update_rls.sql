-- Description: Optimizes the RLS policy "Profiles: User can UPDATE own profile"
-- by wrapping auth.uid() in subselects to improve performance.

-- Drop the existing policy
DROP POLICY IF EXISTS "Profiles: User can UPDATE own profile" ON public.profiles;

-- Recreate the policy with the performance optimization
CREATE POLICY "Profiles: User can UPDATE own profile"
ON public.profiles FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = id)
WITH CHECK ((SELECT auth.uid()) = id);

COMMENT ON POLICY "Profiles: User can UPDATE own profile" ON public.profiles
IS 'Allows authenticated users to UPDATE their own profile. Optimized for performance.';