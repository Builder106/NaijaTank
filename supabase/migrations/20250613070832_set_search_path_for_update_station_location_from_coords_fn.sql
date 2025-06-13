CREATE OR REPLACE FUNCTION public.update_station_location_from_coords()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = '' -- Set a secure search path
AS $$
BEGIN
  IF NEW.longitude IS NOT NULL AND NEW.latitude IS NOT NULL THEN
    NEW.location = extensions.ST_SetSRID(extensions.ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::extensions.geography;
  ELSE
    NEW.location = NULL;
  END IF;
  RETURN NEW;
END;
$$;