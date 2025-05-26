-- Create a table for public profiles
CREATE TABLE profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
-- Policies will be defined in a later step as per the plan,
-- but it's good to enable RLS on the table from the start.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION public.handle_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at on profile changes
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_profile_update();

-- Optional: Add a comment to the table for clarity
COMMENT ON TABLE profiles IS 'Public user profiles, extending auth.users.';