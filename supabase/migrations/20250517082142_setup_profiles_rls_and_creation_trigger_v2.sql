-- Migration Part 1: Profile Creation Function (no full_name)
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
DROP TRIGGER IF EXISTS on_auth_user_created_create_profile ON auth.users; -- Drop if exists from previous attempts
CREATE TRIGGER on_auth_user_created_create_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_profile_creation();

-- Migration Part 2: RLS Policies for profiles table
CREATE POLICY "Profiles: Allow service_role to insert for new users"
ON public.profiles FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Profiles: User can SELECT own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Profiles: User can UPDATE own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles: Public (anon/auth) can SELECT any profile row for display"
ON public.profiles FOR SELECT TO anon, authenticated
USING (true);
