-- Description: Optimizes the RLS policy "Profiles: User can SELECT own profile"
-- by wrapping auth.uid() in a subselect to improve performance.

-- Drop the existing policy
DROP POLICY IF EXISTS "Profiles: User can SELECT own profile" ON public.profiles;

-- Recreate the policy with the performance optimization
CREATE POLICY "Profiles: User can SELECT own profile"
ON public.profiles FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = id);

COMMENT ON POLICY "Profiles: User can SELECT own profile" ON public.profiles
IS 'Allows authenticated users to SELECT their own profile. Optimized for performance.';