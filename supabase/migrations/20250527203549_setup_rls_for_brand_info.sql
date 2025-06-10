-- Migration to set up Row Level Security for public.brand_info

-- Enable Row Level Security
ALTER TABLE public.brand_info ENABLE ROW LEVEL SECURITY;

-- Grant select access to anon and authenticated roles
-- These roles need explicit permission to select from the table,
-- RLS policies then further define WHICH rows they can access.
GRANT SELECT ON TABLE public.brand_info TO anon;
GRANT SELECT ON TABLE public.brand_info TO authenticated;

-- Policy to allow all authenticated users to read all brand information
CREATE POLICY "Allow authenticated read access to brand_info"
    ON public.brand_info FOR SELECT
    TO authenticated
    USING (true);

-- Policy to allow all anonymous users to read all brand information
CREATE POLICY "Allow anonymous read access to brand_info"
    ON public.brand_info FOR SELECT
    TO anon
    USING (true);

-- Note: No INSERT/UPDATE/DELETE policies are typically needed here for client-side
-- as the 'update-fuel-prices' function uses the service_role key which bypasses RLS by default.
-- If clients were to write, separate policies for 'authenticated' or other roles would be needed
-- for INSERT, UPDATE, DELETE operations.