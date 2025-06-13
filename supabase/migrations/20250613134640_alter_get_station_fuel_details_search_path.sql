ALTER FUNCTION public.get_station_fuel_details(UUID, public.fuel_type_enum[])
SET search_path = '';

COMMENT ON FUNCTION public.get_station_fuel_details(UUID, public.fuel_type_enum[]) IS 'Explicitly sets a secure search_path for the get_station_fuel_details function to address linter warnings. Ensures that the function does not rely on a mutable search path.';
