import { env } from './env';

export const environment = {
  production: true,
  apiUrl: 'PROD_API_URL',
  googleMapsApiKey: env.GOOGLE_MAPS_API_KEY,
  supabaseUrl: env.SUPABASE_URL,
  supabaseKey: env.SUPABASE_KEY
}; 