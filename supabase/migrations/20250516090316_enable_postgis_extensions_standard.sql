-- Ensure the 'extensions' schema exists (Supabase usually creates this)
CREATE SCHEMA IF NOT EXISTS extensions;

-- Enable PostGIS in the 'extensions' schema
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- Enable PostGIS Topology (will create/use 'topology' schema)
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Enable Fuzzy String Match in the 'extensions' schema
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA extensions;

-- Enable PostGIS TIGER Geocoder (will create/use 'tiger' and 'tiger_data' schemas)
CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder;