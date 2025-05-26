-- RLS Policies for favorite_stations table

-- Allow authenticated users to SELECT their OWN favorite station entries
DROP POLICY IF EXISTS "FavoriteStations: User can SELECT own favorites" ON public.favorite_stations;
CREATE POLICY "FavoriteStations: User can SELECT own favorites"
ON public.favorite_stations
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Allow authenticated users to INSERT new favorite station entries for themselves
DROP POLICY IF EXISTS "FavoriteStations: User can INSERT own favorites" ON public.favorite_stations;
CREATE POLICY "FavoriteStations: User can INSERT own favorites"
ON public.favorite_stations
FOR INSERT TO authenticated
WITH CHECK (
    user_id = auth.uid() AND
    (SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())) AND -- User has a profile
    (SELECT EXISTS (SELECT 1 FROM public.stations WHERE id = station_id))    -- Station exists
);

-- Allow authenticated users to DELETE their OWN favorite station entries
DROP POLICY IF EXISTS "FavoriteStations: User can DELETE own favorites" ON public.favorite_stations;
CREATE POLICY "FavoriteStations: User can DELETE own favorites"
ON public.favorite_stations
FOR DELETE TO authenticated
USING (user_id = auth.uid());

COMMENT ON TABLE public.favorite_stations IS 'Favorite stations. RLS allows users to manage their own favorites.';