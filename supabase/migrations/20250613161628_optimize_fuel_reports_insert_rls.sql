-- Description: Optimizes the RLS policy "FuelReports: Authenticated can INSERT new reports"
-- by wrapping auth.uid() in subselects within the WITH CHECK clause to improve performance.

-- Drop the existing policy
DROP POLICY IF EXISTS "FuelReports: Authenticated can INSERT new reports" ON public.fuel_reports;

-- Recreate the policy with the performance optimization
CREATE POLICY "FuelReports: Authenticated can INSERT new reports"
ON public.fuel_reports
FOR INSERT TO authenticated
WITH CHECK (
    user_id = (SELECT auth.uid()) AND
    (SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid())))
);

COMMENT ON POLICY "FuelReports: Authenticated can INSERT new reports" ON public.fuel_reports
IS 'Allows authenticated users to INSERT new reports. Optimized for performance.';