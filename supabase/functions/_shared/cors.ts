export const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:4200, *', // Explicitly add localhost, keep wildcard for now
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, supabase-functions-version', // Added supabase-functions-version just in case
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', // Added GET
}; 