-- Note: It's assumed PostGIS is enabled. If not, `CREATE EXTENSION IF NOT EXISTS postgis;`
-- might be needed as a separate, earlier migration or run directly in the Supabase SQL editor.

CREATE TABLE stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    brand TEXT,
    address_line1 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location GEOGRAPHY(Point, 4326), -- Auto-generated from latitude and longitude
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;

-- Function to update the updated_at column for stations
CREATE OR REPLACE FUNCTION public.handle_station_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at on station changes
CREATE TRIGGER on_station_updated
  BEFORE UPDATE ON stations
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_station_update();

-- Function to automatically update the location GEOGRAPHY point
-- from latitude and longitude on insert or update of those coordinate columns.
CREATE OR REPLACE FUNCTION public.update_station_location_from_coords()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.longitude IS NOT NULL AND NEW.latitude IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  ELSE
    NEW.location = NULL; -- Or handle as an error if lat/lng are truly NOT NULL for a valid station
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update location when latitude or longitude changes, or on insert
CREATE TRIGGER on_station_coordinates_updated
  BEFORE INSERT OR UPDATE OF latitude, longitude ON stations
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_station_location_from_coords();

-- Create a GiST index for efficient geospatial queries on the location column
CREATE INDEX stations_location_idx ON stations USING GIST (location);

-- Add comments for clarity
COMMENT ON TABLE stations IS 'Stores information about petrol stations, including their geospatial location.';
COMMENT ON COLUMN stations.location IS 'Geospatial location (Point) of the station, derived from latitude and longitude. Uses SRID 4326.';