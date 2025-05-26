export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Or your specific frontend domain in production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // Added OPTIONS and other methods if needed
}; 