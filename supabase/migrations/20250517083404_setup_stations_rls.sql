-- RLS Policies for stations table

-- Drop existing policies before creating new ones to ensure idempotency
DROP POLICY IF EXISTS "Stations: Public can SELECT all stations" ON public.stations;
CREATE POLICY "Stations: Public can SELECT all stations"
ON public.stations
FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Stations: Service role can INSERT stations" ON public.stations;
CREATE POLICY "Stations: Service role can INSERT stations"
ON public.stations
FOR INSERT TO service_role
WITH CHECK (true);

DROP POLICY IF EXISTS "Stations: Service role can UPDATE stations" ON public.stations;
CREATE POLICY "Stations: Service role can UPDATE stations"
ON public.stations
FOR UPDATE TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Stations: Service role can DELETE stations" ON public.stations;
CREATE POLICY "Stations: Service role can DELETE stations"
ON public.stations
FOR DELETE TO service_role
USING (true);

COMMENT ON TABLE public.stations IS 'Stores petrol station information. RLS allows public read and admin modifications.';