import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment'; // Adjusted path

@Injectable({
  providedIn: 'root'
})

export class SupabaseService {
  public supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = environment.supabaseUrl;
    const supabaseKey = environment.supabaseKey;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase URL or key is missing in environment configuration');
    }
    
    this.supabase = createClient(
      supabaseUrl,
      supabaseKey
    );
  }
} 