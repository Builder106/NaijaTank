CREATE OR REPLACE FUNCTION get_stations_with_latest_report(fuel_filter TEXT DEFAULT NULL)
RETURNS TABLE (
    station_id UUID,
    name TEXT,
    brand TEXT,
    address TEXT,
    latitude FLOAT,
    longitude FLOAT,
    latest_report_id UUID,
    latest_price NUMERIC(10, 2),
    latest_is_available BOOLEAN,
    latest_queue_length TEXT,
    latest_reported_at TIMESTAMPTZ
)
LANGUAGE sql
AS $$
    SELECT
        s.id AS station_id,
        s.name,
        s.brand,
        s.address,
        s.latitude,
        s.longitude,
        lr.id AS latest_report_id,
        lr.price AS latest_price,
        lr.is_available AS latest_is_available,
        lr.queue_length AS latest_queue_length,
        lr.reported_at AS latest_reported_at
    FROM
        stations s
    LEFT JOIN LATERAL (
        SELECT
            fr.id,
            fr.price,
            fr.is_available,
            fr.queue_length,
            fr.reported_at
        FROM
            fuel_reports fr
        WHERE
            fr.station_id = s.id
            AND (fuel_filter IS NULL OR fr.fuel_type = fuel_filter::public.fuel_type_enum)
        ORDER BY
            fr.reported_at DESC
        LIMIT 1
    ) lr ON TRUE;
$$;