import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get environment variables
export const env = {
  GOOGLE_MAPS_API_KEY: process.env['GOOGLE_MAPS_API_KEY'],
  SUPABASE_URL: process.env['SUPABASE_PROJECT_URL'],
  SUPABASE_KEY: process.env['SUPABASE_ANON_KEY']
}; 