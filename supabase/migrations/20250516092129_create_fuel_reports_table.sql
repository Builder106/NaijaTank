-- First, create the ENUM types if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fuel_type_enum') THEN
        CREATE TYPE public.fuel_type_enum AS ENUM (
            'PMS',  -- Premium Motor Spirit (Petrol)
            'AGO',  -- Automotive Gas Oil (Diesel)
            'DPK',  -- Dual Purpose Kerosene
            'LPG'   -- Liquefied Petroleum Gas
        );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'queue_length_enum') THEN
        CREATE TYPE public.queue_length_enum AS ENUM (
            'NONE',
            'SHORT',
            'MEDIUM',
            'LONG',
            'VERY_LONG'
        );
    END IF;
END$$;

-- Create the fuel_reports table
CREATE TABLE public.fuel_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Can be NULL if profile deleted
    station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
    fuel_type public.fuel_type_enum NOT NULL,
    price DECIMAL(10, 2), -- Nullable if report is only about availability/queue
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    queue_length public.queue_length_enum, -- Nullable
    notes TEXT,
    photo_urls TEXT[], -- Array of URLs/paths to photos in Supabase Storage
    reported_at TIMESTAMPTZ DEFAULT NOW(), -- Timestamp of when the report was submitted/observed
    updated_at TIMESTAMPTZ DEFAULT NOW()  -- Timestamp of the last edit
);

-- Enable Row Level Security
ALTER TABLE public.fuel_reports ENABLE ROW LEVEL SECURITY;

-- Function to update the updated_at column for fuel_reports
CREATE OR REPLACE FUNCTION public.handle_fuel_report_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- Run with definer's privileges

-- Trigger to update updated_at on fuel_report changes
CREATE TRIGGER on_fuel_report_updated
  BEFORE UPDATE ON public.fuel_reports
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_fuel_report_update();

-- Indexes for common query patterns
CREATE INDEX idx_fuel_reports_user_id ON public.fuel_reports(user_id);
CREATE INDEX idx_fuel_reports_station_id ON public.fuel_reports(station_id);
CREATE INDEX idx_fuel_reports_reported_at ON public.fuel_reports(reported_at DESC);
CREATE INDEX idx_fuel_reports_fuel_type ON public.fuel_reports(fuel_type); -- If filtering by fuel type is common

-- Comments for clarity
COMMENT ON TABLE public.fuel_reports IS 'Stores user-submitted reports about fuel status, queue length, price, and photos at stations.';
COMMENT ON COLUMN public.fuel_reports.user_id IS 'User who submitted the report. Becomes NULL if user profile is deleted.';
COMMENT ON COLUMN public.fuel_reports.photo_urls IS 'Array of URLs or paths to photos related to the report, stored in Supabase Storage.';
COMMENT ON COLUMN public.fuel_reports.reported_at IS 'Timestamp of when the fuel situation was observed or the report was submitted.';
COMMENT ON COLUMN public.fuel_reports.updated_at IS 'Timestamp of the last edit to the report (within the allowed edit window).';