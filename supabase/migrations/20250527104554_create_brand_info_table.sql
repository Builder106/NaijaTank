-- Table Definition
CREATE TABLE public.brand_info (
    brand_key                 TEXT        PRIMARY KEY NOT NULL,
    website                   TEXT        NULL,
    petrol_price              NUMERIC     NULL,
    diesel_price              NUMERIC     NULL,
    kerosene_price            NUMERIC     NULL,
    gas_price                 NUMERIC     NULL,
    prices_last_updated_at    TIMESTAMPTZ NULL,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table Comment
COMMENT ON TABLE public.brand_info
    IS 'Stores gas station brand information, including websites and fuel prices.';

-- Column Comments
COMMENT ON COLUMN public.brand_info.brand_key
    IS 'The string key of the gas station brand (e.g., "NNPC", "Shell"). Primary Key.';

COMMENT ON COLUMN public.brand_info.website
    IS 'The official website URL of the brand. The domain of this URL will be used for logo fetching.';

COMMENT ON COLUMN public.brand_info.petrol_price
    IS 'Current price of petrol (PMS).';

COMMENT ON COLUMN public.brand_info.diesel_price
    IS 'Current price of diesel (AGO).';

COMMENT ON COLUMN public.brand_info.kerosene_price
    IS 'Current price of kerosene.';

COMMENT ON COLUMN public.brand_info.gas_price
    IS 'Current price of LPG/Gas.';

COMMENT ON COLUMN public.brand_info.prices_last_updated_at
    IS 'Timestamp of when the fuel prices were last successfully fetched and updated.';

-- Function to Update `updated_at` Timestamp Automatically
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to Invoke the Function Before Any UPDATE
CREATE TRIGGER on_brand_info_updated
    BEFORE UPDATE ON public.brand_info
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();