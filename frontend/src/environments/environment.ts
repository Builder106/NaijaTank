import { env } from './env';

export const environment = {
  production: false,
  apiUrl: env.SUPABASE_URL + '/rest/v1',
  googleMapsApiKey: env.GOOGLE_MAPS_API_KEY,
  supabaseUrl: env.SUPABASE_URL,
  supabaseKey: env.SUPABASE_KEY
};