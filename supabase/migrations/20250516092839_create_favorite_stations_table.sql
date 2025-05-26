CREATE TABLE public.favorite_stations (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, station_id) -- Composite primary key ensures a user can favorite a station only once
);

-- Enable Row Level Security
ALTER TABLE public.favorite_stations ENABLE ROW LEVEL SECURITY;

-- Indexes for efficient querying
-- The primary key already creates an index on (user_id, station_id).
-- You might want separate indexes if you query often by only one of them,
-- though for a simple junction table, the PK index is often sufficient.
CREATE INDEX idx_favorite_stations_user_id ON public.favorite_stations(user_id);
CREATE INDEX idx_favorite_stations_station_id ON public.favorite_stations(station_id);

-- Comments for clarity
COMMENT ON TABLE public.favorite_stations IS 'Junction table linking users to their favorite stations.';
COMMENT ON COLUMN public.favorite_stations.user_id IS 'The ID of the user who favorited the station.';
COMMENT ON COLUMN public.favorite_stations.station_id IS 'The ID of the station that was favorited.';
COMMENT ON COLUMN public.favorite_stations.created_at IS 'Timestamp of when the station was marked as a favorite.';