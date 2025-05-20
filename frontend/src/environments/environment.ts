import { env } from './env';

export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  googleMapsApiKey: env.GOOGLE_MAPS_API_KEY,
  supabaseUrl: env.SUPABASE_URL,
  supabaseKey: env.SUPABASE_KEY
};