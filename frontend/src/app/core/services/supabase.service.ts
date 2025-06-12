import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class SupabaseService {
  public supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = environment.supabaseUrl;
    const supabaseKey = environment.supabaseKey;
    
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