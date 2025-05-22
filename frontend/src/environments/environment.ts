export const environment = {
  production: false,
  apiUrl: import.meta.env.VITE_SUPABASE_URL + '/rest/v1',
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseKey: import.meta.env.VITE_SUPABASE_KEY
};

console.log('Loaded VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Loaded VITE_GOOGLE_MAPS_API_KEY:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY);