create extension if not exists "pgjwt" with schema "extensions";


drop policy "FuelReports: Public can SELECT all reports" on "public"."fuel_reports";

drop policy "Stations: Public can SELECT all stations" on "public"."stations";

drop function if exists "public"."get_stations_with_latest_report"(fuel_filter text);

alter type "public"."fuel_type_enum" rename to "fuel_type_enum__old_version_to_be_dropped";

create type "public"."fuel_type_enum" as enum ('Petrol', 'Diesel', 'Kerosene', 'Gas');

alter type "public"."queue_length_enum" rename to "queue_length_enum__old_version_to_be_dropped";

create type "public"."queue_length_enum" as enum ('None', 'Short', 'Medium', 'Long', 'Very_long');

alter table "public"."fuel_reports" alter column fuel_type type "public"."fuel_type_enum" using fuel_type::text::"public"."fuel_type_enum";

alter table "public"."fuel_reports" alter column queue_length type "public"."queue_length_enum" using queue_length::text::"public"."queue_length_enum";

-- Explicitly drop the function with the old signature before redefining it and dropping the old type
DROP FUNCTION IF EXISTS public.get_station_fuel_details(UUID, public.fuel_type_enum__old_version_to_be_dropped[]);

-- Update the function to use the new enum values before dropping the old enum
CREATE OR REPLACE FUNCTION get_station_fuel_details(target_station_id UUID DEFAULT NULL, target_fuel_types public.fuel_type_enum[] DEFAULT NULL)
RETURNS TABLE (
    station_id UUID,
    name TEXT,
    brand TEXT,
    address TEXT,
    latitude FLOAT,
    longitude FLOAT,
    -- Petrol
    petrol_price NUMERIC(10, 2),
    petrol_available BOOLEAN,
    petrol_queue_length TEXT,
    petrol_reported_at TIMESTAMPTZ,
    -- Diesel
    diesel_price NUMERIC(10, 2),
    diesel_available BOOLEAN,
    diesel_queue_length TEXT,
    diesel_reported_at TIMESTAMPTZ,
    -- Kerosene
    kerosene_price NUMERIC(10, 2),
    kerosene_available BOOLEAN,
    kerosene_queue_length TEXT,
    kerosene_reported_at TIMESTAMPTZ,
    -- Gas
    gas_price NUMERIC(10, 2),
    gas_available BOOLEAN,
    gas_queue_length TEXT,
    gas_reported_at TIMESTAMPTZ
)
LANGUAGE sql STABLE
AS $$
SELECT
    s.id AS station_id,
    s.name,
    s.brand,
    s.address,
    s.latitude,
    s.longitude,

    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'Petrol'::public.fuel_type_enum = ANY(target_fuel_types) THEN pms_latest_report.price
        ELSE NULL
    END AS petrol_price,
    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'Petrol'::public.fuel_type_enum = ANY(target_fuel_types) THEN pms_latest_report.is_available
        ELSE NULL
    END AS petrol_available,
    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'Petrol'::public.fuel_type_enum = ANY(target_fuel_types) THEN pms_latest_report.queue_length
        ELSE NULL
    END AS petrol_queue_length,
    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'Petrol'::public.fuel_type_enum = ANY(target_fuel_types) THEN pms_latest_report.reported_at
        ELSE NULL
    END AS petrol_reported_at,

    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'Diesel'::public.fuel_type_enum = ANY(target_fuel_types) THEN ago_latest_report.price
        ELSE NULL
    END AS diesel_price,
    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'Diesel'::public.fuel_type_enum = ANY(target_fuel_types) THEN ago_latest_report.is_available
        ELSE NULL
    END AS diesel_available,
    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'Diesel'::public.fuel_type_enum = ANY(target_fuel_types) THEN ago_latest_report.queue_length
        ELSE NULL
    END AS diesel_queue_length,
    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'Diesel'::public.fuel_type_enum = ANY(target_fuel_types) THEN ago_latest_report.reported_at
        ELSE NULL
    END AS diesel_reported_at,

    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'Kerosene'::public.fuel_type_enum = ANY(target_fuel_types) THEN dpk_latest_report.price
        ELSE NULL
    END AS kerosene_price,
    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'Kerosene'::public.fuel_type_enum = ANY(target_fuel_types) THEN dpk_latest_report.is_available
        ELSE NULL
    END AS kerosene_available,
    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'Kerosene'::public.fuel_type_enum = ANY(target_fuel_types) THEN dpk_latest_report.queue_length
        ELSE NULL
    END AS kerosene_queue_length,
    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'Kerosene'::public.fuel_type_enum = ANY(target_fuel_types) THEN dpk_latest_report.reported_at
        ELSE NULL
    END AS kerosene_reported_at,

    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'Gas'::public.fuel_type_enum = ANY(target_fuel_types) THEN lpg_latest_report.price
        ELSE NULL
    END AS gas_price,
    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'Gas'::public.fuel_type_enum = ANY(target_fuel_types) THEN lpg_latest_report.is_available
        ELSE NULL
    END AS gas_available,
    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'Gas'::public.fuel_type_enum = ANY(target_fuel_types) THEN lpg_latest_report.queue_length
        ELSE NULL
    END AS gas_queue_length,
    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'Gas'::public.fuel_type_enum = ANY(target_fuel_types) THEN lpg_latest_report.reported_at
        ELSE NULL
    END AS gas_reported_at
FROM
    stations s
LEFT JOIN LATERAL (
    SELECT fr.price, fr.is_available, fr.queue_length, fr.reported_at
    FROM fuel_reports fr
    WHERE fr.station_id = s.id AND fr.fuel_type = 'Petrol'::public.fuel_type_enum
    ORDER BY fr.reported_at DESC LIMIT 1
) pms_latest_report ON TRUE
LEFT JOIN LATERAL (
    SELECT fr.price, fr.is_available, fr.queue_length, fr.reported_at
    FROM fuel_reports fr
    WHERE fr.station_id = s.id AND fr.fuel_type = 'Diesel'::public.fuel_type_enum
    ORDER BY fr.reported_at DESC LIMIT 1
) ago_latest_report ON TRUE
LEFT JOIN LATERAL (
    SELECT fr.price, fr.is_available, fr.queue_length, fr.reported_at
    FROM fuel_reports fr
    WHERE fr.station_id = s.id AND fr.fuel_type = 'Kerosene'::public.fuel_type_enum
    ORDER BY fr.reported_at DESC LIMIT 1
) dpk_latest_report ON TRUE
LEFT JOIN LATERAL (
    SELECT fr.price, fr.is_available, fr.queue_length, fr.reported_at
    FROM fuel_reports fr
    WHERE fr.station_id = s.id AND fr.fuel_type = 'Gas'::public.fuel_type_enum
    ORDER BY fr.reported_at DESC LIMIT 1
) lpg_latest_report ON TRUE
WHERE (target_station_id IS NULL OR s.id = target_station_id);
$$;

drop type "public"."fuel_type_enum__old_version_to_be_dropped" CASCADE;

drop type "public"."queue_length_enum__old_version_to_be_dropped" CASCADE;

create policy "FuelReports: Public can SELECT all reports"
on "public"."fuel_reports"
as permissive
for select
to authenticated, anon
using (true);


create policy "Stations: Public can SELECT all stations"
on "public"."stations"
as permissive
for select
to authenticated, anon
using (true);



