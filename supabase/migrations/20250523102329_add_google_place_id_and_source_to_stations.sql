-- Add the new columns
ALTER TABLE public.stations
ADD COLUMN google_place_id TEXT NULL,
ADD COLUMN source_type TEXT NOT NULL DEFAULT 'naijatank_direct_entry';

-- Make existing content columns nullable if they aren't already,
-- to accommodate Google Place ID references that won't store this data directly.
ALTER TABLE public.stations
ALTER COLUMN name DROP NOT NULL,
ALTER COLUMN address DROP NOT NULL,
ALTER COLUMN latitude DROP NOT NULL,
ALTER COLUMN longitude DROP NOT NULL;


-- Add a partial unique index to ensure google_place_id is unique when it's not NULL.
CREATE UNIQUE INDEX IF NOT EXISTS unique_google_place_id_when_not_null
ON public.stations (google_place_id)
WHERE google_place_id IS NOT NULL;

-- Optionally, add a check constraint for known source_type values if desired
ALTER TABLE public.stations
ADD CONSTRAINT valid_source_type CHECK (source_type IN ('naijatank_direct_entry', 'google_places_reference', 'user_submitted'));