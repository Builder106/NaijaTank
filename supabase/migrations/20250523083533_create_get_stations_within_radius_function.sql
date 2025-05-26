CREATE OR REPLACE FUNCTION get_stations_within_radius(lat float, lng float, radius_km float)
RETURNS SETOF stations
LANGUAGE sql
AS $$
  SELECT * FROM stations
  WHERE ST_DWithin(
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography, -- Assuming 'longitude', 'latitude' columns exist in 'stations' table
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
    radius_km * 1000 -- ST_DWithin for geography expects distance in meters
  );
$$;