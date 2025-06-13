-- Description: Optimizes the RLS policy "FavoriteStations: User can INSERT own favorites"
-- by wrapping auth.uid() in subselects to improve performance.

-- Drop the existing policy
DROP POLICY IF EXISTS "FavoriteStations: User can INSERT own favorites" ON public.favorite_stations;

-- Recreate the policy with the performance optimization
CREATE POLICY "FavoriteStations: User can INSERT own favorites"
ON public.favorite_stations
FOR INSERT TO authenticated
WITH CHECK (
    user_id = (SELECT auth.uid()) AND
    (SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()))) AND
    (SELECT EXISTS (SELECT 1 FROM public.stations WHERE id = station_id))
);

COMMENT ON POLICY "FavoriteStations: User can INSERT own favorites" ON public.favorite_stations
IS 'Allows authenticated users to INSERT new favorite station entries for themselves. Optimized for performance.';