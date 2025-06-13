-- Description: Optimizes the RLS policy "FuelReports: Owner can UPDATE own report within time limit"
-- by wrapping auth.uid() in subselects to improve performance.

-- Drop the existing policy
DROP POLICY IF EXISTS "FuelReports: Owner can UPDATE own report within time limit" ON public.fuel_reports;

-- Recreate the policy with the performance optimization
CREATE POLICY "FuelReports: Owner can UPDATE own report within time limit"
ON public.fuel_reports
FOR UPDATE TO authenticated
USING (
    user_id = (SELECT auth.uid()) AND
    (NOW() - reported_at) < INTERVAL '10 minutes'
)
WITH CHECK (
    user_id = (SELECT auth.uid()) AND
    (NOW() - reported_at) < INTERVAL '10 minutes'
);

COMMENT ON POLICY "FuelReports: Owner can UPDATE own report within time limit" ON public.fuel_reports
IS 'Allows authenticated users to UPDATE their OWN reports within a time limit. Optimized for performance.';