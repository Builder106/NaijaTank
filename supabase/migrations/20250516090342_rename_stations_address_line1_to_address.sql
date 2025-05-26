-- Renames the address_line1 column to address in the stations table
ALTER TABLE public.stations
RENAME COLUMN address_line1 TO address;

COMMENT ON COLUMN public.stations.address IS 'Full address of the station, previously address_line1.'; 