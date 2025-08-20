import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {
  AuthChangeEvent,
  AuthSession,
  Session,
  User,
  Provider,
  SignInWithPasswordCredentials,
  SignUpWithPasswordCredentials,
} from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { Store } from '@ngrx/store';
import * as AuthActions from '../../store/actions/auth.actions';
import { AppState } from '../../store';

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private currentUser: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  private currentSession: BehaviorSubject<Session | null> = new BehaviorSubject<Session | null>(null);
  public readonly currentUser$: Observable<User | null> = this.currentUser.asObservable();
  public readonly currentSession$: Observable<Session | null> = this.currentSession.asObservable();
  
  private authStateSubscription?: { data: { subscription: any } };

  constructor(
    private router: Router,
    private supabaseService: SupabaseService,
    private store: Store<AppState>
  ) {
    // Store the subscription reference for proper cleanup
    this.authStateSubscription = this.supabaseService.supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: AuthSession | null) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        this.currentUser.next(session?.user ?? null);
        this.currentSession.next(session);
        this.store.dispatch(AuthActions.sessionUpdate({
          user: session?.user ?? null,
          session: session,
        }));
        if (event === 'SIGNED_IN' && this.router.url.includes('/auth')) {
          const returnUrl = this.router.parseUrl(this.router.url).queryParams['returnUrl'] || '/';
          this.router.navigateByUrl(returnUrl);
        }
      } else if (event === 'SIGNED_OUT') {
        this.currentUser.next(null);
        this.currentSession.next(null);
        this.store.dispatch(AuthActions.logoutSuccess());
        this.router.navigate(['/auth/login']);
      }
    });
    this.loadInitialSession();
  }

  ngOnDestroy(): void {
    // Clean up the auth state change subscription
    if (this.authStateSubscription?.data?.subscription) {
      this.authStateSubscription.data.subscription.unsubscribe();
    }
    
    // Complete the BehaviorSubjects
    this.currentUser.complete();
    this.currentSession.complete();
  }

  private async loadInitialSession() {
    const { data: { session } } = await this.supabaseService.supabase.auth.getSession();
    if (session) {
      this.currentUser.next(session.user);
      this.currentSession.next(session);
      this.store.dispatch(AuthActions.sessionUpdate({
        user: session.user,
        session: session,
      }));
    } else {
      this.currentUser.next(null);
      this.currentSession.next(null);
      this.store.dispatch(AuthActions.logoutSuccess());
    }
  }

  async signUp(credentials: SignUpWithPasswordCredentials & { fullName?: string }) {
    const { fullName, ...authCredentials } = credentials;
    const { data, error } = await this.supabaseService.supabase.auth.signUp({
      ...authCredentials,
      options: {
        data: {
          full_name: fullName,
          name: fullName
        }
      }
    });
    return { user: data.user, session: data.session, error };
  }

  async signInWithEmailPassword(credentials: SignInWithPasswordCredentials) {
    const { data, error } = await this.supabaseService.supabase.auth.signInWithPassword(credentials);
    return { user: data.user, session: data.session, error };
  }

  async signInWithGoogle() {
    const { data, error } = await this.supabaseService.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // redirectTo: 'http://localhost:4200/auth/callback' // Ensure this is configured in Supabase & Google Cloud
        // queryParams: { // if you need offline access for Google provider_token later
        //   access_type: 'offline',
        //   prompt: 'consent',
        // }
      },
    });
    return { data, error }; // data will contain the provider, url, etc. The session is set via onAuthStateChange after redirect.
  }

  async signOut() {
    const { error } = await this.supabaseService.supabase.auth.signOut();
    return { error };
  }

  public get getCurrentUserValue(): User | null {
    return this.currentUser.value;
  }

  public get getCurrentSessionValue(): Session | null {
    return this.currentSession.value;
  }

  public isAuthenticated(): boolean {
    return !!this.getCurrentUserValue && !!this.getCurrentSessionValue;
  }
}