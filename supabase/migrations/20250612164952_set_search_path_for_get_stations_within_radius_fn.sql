CREATE OR REPLACE FUNCTION public.get_stations_within_radius(lat float, lng float, radius_km float)
RETURNS SETOF public.stations -- Qualify the return table type
LANGUAGE sql
SET search_path = '' -- Set a secure search path
AS $$
  SELECT * FROM public.stations -- Schema-qualify the 'stations' table
  WHERE extensions.ST_DWithin( -- Schema-qualify PostGIS function
    extensions.ST_SetSRID(extensions.ST_MakePoint(longitude, latitude), 4326)::extensions.geography, -- longitude and latitude are columns from public.stations
    extensions.ST_SetSRID(extensions.ST_MakePoint(lng, lat), 4326)::extensions.geography, -- lng and lat are function parameters
    radius_km * 1000
  );
$$;