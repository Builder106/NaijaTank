export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Replace '*' with specific origins in production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Ensure this includes all methods your function uses
}; 