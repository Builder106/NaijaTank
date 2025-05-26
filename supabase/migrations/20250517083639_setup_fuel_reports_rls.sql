-- RLS Policies for fuel_reports table

-- Allow public read access to all fuel reports
DROP POLICY IF EXISTS "FuelReports: Public can SELECT all reports" ON public.fuel_reports;
CREATE POLICY "FuelReports: Public can SELECT all reports"
ON public.fuel_reports
FOR SELECT TO anon, authenticated
USING (true);

-- Allow authenticated users to INSERT new reports
DROP POLICY IF EXISTS "FuelReports: Authenticated can INSERT new reports" ON public.fuel_reports;
CREATE POLICY "FuelReports: Authenticated can INSERT new reports"
ON public.fuel_reports
FOR INSERT TO authenticated
WITH CHECK (
    user_id = auth.uid() AND -- Ensures they are setting their own user_id
    (SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())) -- Ensures they have a profile
);

-- Allow authenticated users to UPDATE their OWN reports within a time window (e.g., 10 minutes)
DROP POLICY IF EXISTS "FuelReports: Owner can UPDATE own report within time limit" ON public.fuel_reports;
CREATE POLICY "FuelReports: Owner can UPDATE own report within time limit"
ON public.fuel_reports
FOR UPDATE TO authenticated
USING (
    user_id = auth.uid() AND
    (NOW() - reported_at) < INTERVAL '10 minutes' -- Check if report is within 10 mins
)
WITH CHECK (
    user_id = auth.uid() AND -- Must remain their own report
    (NOW() - reported_at) < INTERVAL '10 minutes'
);

-- Allow service_role (or a future admin role) to DELETE reports
DROP POLICY IF EXISTS "FuelReports: Service role can DELETE reports" ON public.fuel_reports;
CREATE POLICY "FuelReports: Service role can DELETE reports"
ON public.fuel_reports
FOR DELETE TO service_role
USING (true);

COMMENT ON TABLE public.fuel_reports IS 'Fuel reports. RLS allows public read, authenticated insert/update (own, time-limited), and admin delete.';