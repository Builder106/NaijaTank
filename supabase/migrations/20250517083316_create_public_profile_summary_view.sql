-- Migration: create_public_profile_summary_view

-- Create a VIEW that exposes only public-facing profile information
CREATE OR REPLACE VIEW public.public_profile_summary AS
  SELECT id, username, avatar_url
  FROM public.profiles;

-- Grant SELECT access on this view to anonymous and authenticated users
GRANT SELECT ON public.public_profile_summary TO anon;
GRANT SELECT ON public.public_profile_summary TO authenticated;

COMMENT ON VIEW public.public_profile_summary IS 'Provides a public view of select profile fields (id, username, avatar_url) for display purposes.';