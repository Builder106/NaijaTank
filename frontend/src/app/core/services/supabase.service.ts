import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})

export class SupabaseService {
  public supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = import.meta.env.NG_APP_SUPABASE_URL;
    const supabaseKey = import.meta.env.NG_APP_SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      // console.error('Supabase URL or key is missing in environment configuration');
      throw new Error('Supabase URL or key is missing in environment configuration. Check your .env file or server environment variables.');
    }
    
    this.supabase = createClient(
      supabaseUrl,
      supabaseKey
    );
  }
} 