export const environment = {
   production: true,
   apiUrl: import.meta.env.NG_APP_SUPABASE_URL + '/rest/v1',
   googleMapsApiKey: import.meta.env.NG_APP_GOOGLE_MAPS_API_KEY,
   supabaseUrl: import.meta.env.NG_APP_SUPABASE_URL,
   supabaseKey: import.meta.env.NG_APP_SUPABASE_KEY
 };