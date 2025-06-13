-- Description: Optimizes the RLS policy "FavoriteStations: User can DELETE own favorites"
-- by wrapping auth.uid() in a subselect to improve performance.

-- Drop the existing policy
DROP POLICY IF EXISTS "FavoriteStations: User can DELETE own favorites" ON public.favorite_stations;

-- Recreate the policy with the performance optimization
CREATE POLICY "FavoriteStations: User can DELETE own favorites"
ON public.favorite_stations
FOR DELETE TO authenticated
USING (user_id = (SELECT auth.uid()));

COMMENT ON POLICY "FavoriteStations: User can DELETE own favorites" ON public.favorite_stations
IS 'Allows authenticated users to DELETE their OWN favorite station entries. Optimized for performance.';