CREATE OR REPLACE FUNCTION get_station_fuel_details(target_station_id UUID DEFAULT NULL, target_fuel_types public.fuel_type_enum[] DEFAULT NULL)
RETURNS TABLE (
    station_id UUID,
    name TEXT,
    brand TEXT,
    address TEXT,
    latitude FLOAT,
    longitude FLOAT,
    -- Petrol (PMS)
    petrol_price NUMERIC(10, 2),
    petrol_available BOOLEAN,
    petrol_queue_length TEXT,
    petrol_reported_at TIMESTAMPTZ,
    -- Diesel (AGO)
    diesel_price NUMERIC(10, 2),
    diesel_available BOOLEAN,
    diesel_queue_length TEXT,
    diesel_reported_at TIMESTAMPTZ,
    -- Kerosene (DPK)
    kerosene_price NUMERIC(10, 2),
    kerosene_available BOOLEAN,
    kerosene_queue_length TEXT,
    kerosene_reported_at TIMESTAMPTZ,
    -- Gas (LPG)
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
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'PMS'::public.fuel_type_enum = ANY(target_fuel_types) THEN pms_latest_report.price
        ELSE NULL
    END AS petrol_price,
    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'PMS'::public.fuel_type_enum = ANY(target_fuel_types) THEN pms_latest_report.is_available
        ELSE NULL
    END AS petrol_available,
    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'PMS'::public.fuel_type_enum = ANY(target_fuel_types) THEN pms_latest_report.queue_length
        ELSE NULL
    END AS petrol_queue_length,
    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'PMS'::public.fuel_type_enum = ANY(target_fuel_types) THEN pms_latest_report.reported_at
        ELSE NULL
    END AS petrol_reported_at,

    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'AGO'::public.fuel_type_enum = ANY(target_fuel_types) THEN ago_latest_report.price
        ELSE NULL
    END AS diesel_price,
    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'AGO'::public.fuel_type_enum = ANY(target_fuel_types) THEN ago_latest_report.is_available
        ELSE NULL
    END AS diesel_available,
    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'AGO'::public.fuel_type_enum = ANY(target_fuel_types) THEN ago_latest_report.queue_length
        ELSE NULL
    END AS diesel_queue_length,
    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'AGO'::public.fuel_type_enum = ANY(target_fuel_types) THEN ago_latest_report.reported_at
        ELSE NULL
    END AS diesel_reported_at,

    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'DPK'::public.fuel_type_enum = ANY(target_fuel_types) THEN dpk_latest_report.price
        ELSE NULL
    END AS kerosene_price,
    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'DPK'::public.fuel_type_enum = ANY(target_fuel_types) THEN dpk_latest_report.is_available
        ELSE NULL
    END AS kerosene_available,
    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'DPK'::public.fuel_type_enum = ANY(target_fuel_types) THEN dpk_latest_report.queue_length
        ELSE NULL
    END AS kerosene_queue_length,
    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'DPK'::public.fuel_type_enum = ANY(target_fuel_types) THEN dpk_latest_report.reported_at
        ELSE NULL
    END AS kerosene_reported_at,

    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'LPG'::public.fuel_type_enum = ANY(target_fuel_types) THEN lpg_latest_report.price
        ELSE NULL
    END AS gas_price,
    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'LPG'::public.fuel_type_enum = ANY(target_fuel_types) THEN lpg_latest_report.is_available
        ELSE NULL
    END AS gas_available,
    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'LPG'::public.fuel_type_enum = ANY(target_fuel_types) THEN lpg_latest_report.queue_length
        ELSE NULL
    END AS gas_queue_length,
    CASE
        WHEN target_fuel_types IS NULL OR target_fuel_types = '{}' OR 'LPG'::public.fuel_type_enum = ANY(target_fuel_types) THEN lpg_latest_report.reported_at
        ELSE NULL
    END AS gas_reported_at
FROM
    stations s
LEFT JOIN LATERAL (
    SELECT fr.price, fr.is_available, fr.queue_length, fr.reported_at
    FROM fuel_reports fr
    WHERE fr.station_id = s.id AND fr.fuel_type = 'PMS'::public.fuel_type_enum
    ORDER BY fr.reported_at DESC LIMIT 1
) pms_latest_report ON TRUE
LEFT JOIN LATERAL (
    SELECT fr.price, fr.is_available, fr.queue_length, fr.reported_at
    FROM fuel_reports fr
    WHERE fr.station_id = s.id AND fr.fuel_type = 'AGO'::public.fuel_type_enum
    ORDER BY fr.reported_at DESC LIMIT 1
) ago_latest_report ON TRUE
LEFT JOIN LATERAL (
    SELECT fr.price, fr.is_available, fr.queue_length, fr.reported_at
    FROM fuel_reports fr
    WHERE fr.station_id = s.id AND fr.fuel_type = 'DPK'::public.fuel_type_enum
    ORDER BY fr.reported_at DESC LIMIT 1
) dpk_latest_report ON TRUE
LEFT JOIN LATERAL (
    SELECT fr.price, fr.is_available, fr.queue_length, fr.reported_at
    FROM fuel_reports fr
    WHERE fr.station_id = s.id AND fr.fuel_type = 'LPG'::public.fuel_type_enum
    ORDER BY fr.reported_at DESC LIMIT 1
) lpg_latest_report ON TRUE
WHERE (target_station_id IS NULL OR s.id = target_station_id);
$$;