import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class SupabaseService {
  private supabase: SupabaseClient;
  private initializationSubject = new BehaviorSubject<boolean>(false);
  public initialized$ = this.initializationSubject.asObservable();

  constructor() {
    this.initializeSupabase();
  }

  private async initializeSupabase() {
    try {
      this.supabase = createClient(
        environment.supabaseUrl,
        environment.supabaseAnonKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            // Add retry configuration for lock manager issues
            storageKey: `sb-${environment.supabaseUrl.split('//')[1].split('.')[0]}-auth-token`,
            storage: {
              getItem: (key: string) => {
                try {
                  return localStorage.getItem(key);
                } catch (error) {
                  console.warn('Failed to get item from localStorage:', error);
                  return null;
                }
              },
              setItem: (key: string, value: string) => {
                try {
                  localStorage.setItem(key, value);
                } catch (error) {
                  console.warn('Failed to set item in localStorage:', error);
                }
              },
              removeItem: (key: string) => {
                try {
                  localStorage.removeItem(key);
                } catch (error) {
                  console.warn('Failed to remove item from localStorage:', error);
                }
              }
            }
          }
        }
      );

      // Handle auth state changes with error handling
      this.supabase.auth.onAuthStateChange((event, session) => {
        try {
          // Handle auth state changes here if needed
          console.log('Auth state changed:', event, session?.user?.id);
        } catch (error) {
          console.warn('Error handling auth state change:', error);
        }
      });

      this.initializationSubject.next(true);
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      // Fallback initialization without custom storage
      this.supabase = createClient(
        environment.supabaseUrl,
        environment.supabaseAnonKey
      );
      this.initializationSubject.next(true);
    }
  }

  get client() {
    return this.supabase;
  }
}