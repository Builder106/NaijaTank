export const environment = {
   production: true,
   apiUrl: import.meta.env.VITE_SUPABASE_URL + '/rest/v1',
   googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
   supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
   supabaseKey: import.meta.env.VITE_SUPABASE_KEY
 };