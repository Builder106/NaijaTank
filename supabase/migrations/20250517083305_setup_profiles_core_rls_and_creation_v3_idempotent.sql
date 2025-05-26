-- Migration: setup_profiles_core_rls_and_creation_v3 (idempotent)

-- Part 1: Profile Creation Function (no full_name)
CREATE OR REPLACE FUNCTION public.handle_new_user_profile_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url) -- full_name removed
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email), -- Default username
    NEW.raw_user_meta_data->>'avatar_url'                    -- Attempt to get avatar_url from metadata
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists and uses the updated function
DROP TRIGGER IF EXISTS on_auth_user_created_create_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_create_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_profile_creation();

-- Part 2: RLS Policies for profiles table (Owner-specific and service role insert)
-- Drop existing policies before creating new ones to ensure idempotency
DROP POLICY IF EXISTS "Profiles: Allow service_role to insert for new users" ON public.profiles;
CREATE POLICY "Profiles: Allow service_role to insert for new users"
ON public.profiles FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Profiles: User can SELECT own profile" ON public.profiles;
CREATE POLICY "Profiles: User can SELECT own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles: User can UPDATE own profile" ON public.profiles;
CREATE POLICY "Profiles: User can UPDATE own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Remove any broad public select policy if it exists from previous attempts,
-- as public access will be handled by a view.
DROP POLICY IF EXISTS "Profiles: Public (anon/auth) can SELECT any profile row for display" ON public.profiles;

COMMENT ON TABLE public.profiles IS 'User profiles. RLS applied for owner access and automated creation. Public visibility to be handled by public_profile_summary view.';