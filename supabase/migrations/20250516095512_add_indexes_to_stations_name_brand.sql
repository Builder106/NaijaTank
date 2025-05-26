-- Add a B-tree index to stations.name for faster name searches/filtering
CREATE INDEX IF NOT EXISTS idx_stations_name ON public.stations(name);

-- Add a B-tree index to stations.brand for faster brand searches/filtering
CREATE INDEX IF NOT EXISTS idx_stations_brand ON public.stations(brand);

COMMENT ON INDEX idx_stations_name IS 'Index for faster searching and filtering by station name.';
COMMENT ON INDEX idx_stations_brand IS 'Index for faster searching and filtering by station brand.';