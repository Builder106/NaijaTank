import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError, from } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { User as SupabaseUser, Session, AuthError, UserCredentials } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { User } from '../models/user.model'; // Your application's user model
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // private apiUrl = `${environment.apiUrl}/auth`; // Keep if you have other non-Supabase auth calls
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private currentSessionSubject = new BehaviorSubject<Session | null>(null);
  public currentSession$ = this.currentSessionSubject.asObservable();

  public isAuthenticated$: Observable<boolean>;

  constructor(private supabaseService: SupabaseService) {
    this.isAuthenticated$ = this.currentUserSubject.pipe(map(user => !!user));

    // Attempt to load session from Supabase on service initialization
    const session = this.supabaseService.supabase.auth.session();
    this.currentSessionSubject.next(session);
    if (session?.user) {
      // If there's a session, fetch the full profile if necessary
      // For now, just setting the Supabase user.
      // You'll likely want to map this to your app's User model, potentially fetching from 'profiles' table
      this.mapSupabaseUserToAppUser(session.user);
    }


    this.supabaseService.supabase.auth.onAuthStateChange((event, session) => {
      this.currentSessionSubject.next(session);
      if (session?.user) {
        // Map Supabase user to your application's User model
        // This might involve fetching additional profile data from your 'profiles' table
        this.mapSupabaseUserToAppUser(session.user);
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  // Helper to map Supabase user to your app's User model
  // This is a basic mapping. You'll need to extend this based on your User model and 'profiles' table.
  private async mapSupabaseUserToAppUser(supabaseUser: SupabaseUser | null) {
    if (!supabaseUser) {
      this.currentUserSubject.next(null);
      return;
    }

    // Attempt to get profile from 'profiles' table
    const { data: profile, error } = await this.supabaseService.supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: 'No rows found' - profile might not exist yet
      console.error('Error fetching profile:', error);
      // Decide how to handle: maybe set a partial user or null
      this.currentUserSubject.next(null); // Or a User object with minimal data from supabaseUser
      return;
    }
    
    const appUser: User = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      // Map other fields from 'profile' or supabaseUser as needed by your User model
      // Example:
      name: profile?.username || supabaseUser.email?.split('@')[0] || 'User', // Fallback for name
      phoneNumber: profile?.phone_number || '', // Assuming 'phone_number' in profiles
      reputationScore: profile?.reputation_score || 0,
      reportCount: profile?.report_count || 0,
      createdAt: profile?.created_at || supabaseUser.created_at || new Date().toISOString(),
      lastLogin: supabaseUser.last_sign_in_at || new Date().toISOString(),
    };
    this.currentUserSubject.next(appUser);
  }


  async signUp(credentials: UserCredentials): Promise<User | null> {
    const { user, error } = await this.supabaseService.supabase.auth.signUp(credentials);
    if (error) {
      console.error('Sign up error:', error.message);
      throw error;
    }
    // The onAuthStateChange listener will handle setting the user subject
    // but we can call mapSupabaseUserToAppUser directly if immediate mapping is needed post-signup
    // before the auth state change event fully propagates.
    if (user) {
        await this.mapSupabaseUserToAppUser(user); // Manually map for immediate availability
    }
    return this.currentUserSubject.value;
  }

  async signInWithEmailPassword(credentials: UserCredentials): Promise<User | null> {
    const { user, error, session } = await this.supabaseService.supabase.auth.signIn(credentials);
    if (error) {
      console.error('Sign in error:', error.message);
      throw error;
    }
    if (session?.user) {
      await this.mapSupabaseUserToAppUser(session.user);
    }
    return this.currentUserSubject.value;
  }

  // Example for Sign In with Google (OAuth)
  async signInWithGoogle(): Promise<void> {
    const { error } = await this.supabaseService.supabase.auth.signIn({
      provider: 'google',
    }
    // You might want to specify redirectTo options here
    // { redirectTo: environment.baseUrl + '/auth-callback' }
    );
    if (error) {
      console.error('Google sign in error:', error.message);
      throw error;
    }
    // Supabase handles the redirect and onAuthStateChange will pick up the session.
  }


  async signOut(): Promise<void> {
    const { error } = await this.supabaseService.supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error.message);
      throw error;
    }
    // onAuthStateChange will set currentUserSubject to null
  }

  getCurrentUserSnapshot(): User | null {
    return this.currentUserSubject.value;
  }
  
  getSessionSnapshot(): Session | null {
    return this.currentSessionSubject.value;
  }

  // Keep this if you still need a raw Supabase token for some reason,
  // but generally, let Supabase client handle token management internally.
  getAuthToken(): string | null {
    return this.currentSessionSubject.value?.access_token || null;
  }
}