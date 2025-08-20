import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap, exhaustMap } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import * as AuthActions from '../actions/auth.actions';
import { Router } from '@angular/router';
import { User, Session, AuthError, SignInWithPasswordCredentials, SignUpWithPasswordCredentials } from '@supabase/supabase-js';
import { from } from 'rxjs';

@Injectable()
export class AuthEffects {
  constructor(
    private actions$: Actions,
    private authService: AuthService,
    private router: Router
  ) {}

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap((action) =>
        from(this.authService.signInWithEmailPassword({ email: action.email, password: action.password })).pipe(
          map(({ user, session, error }) => {
            if (error) {
              return AuthActions.loginFailure({ error });
            }
            if (user && session) {
              return AuthActions.loginSuccess({ user, session });
            }
            // Should not happen if Supabase client works as expected, but as a fallback:
            return AuthActions.loginFailure({ error: { name: 'LoginError', message: 'User or session is null after login' } as any });
          }),
          catchError((error) => of(AuthActions.loginFailure({ error })))
        )
      )
    )
  );

  loginWithGoogle$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginWithGoogle),
      exhaustMap(() =>
        from(this.authService.signInWithGoogle()).pipe(
          map(({ data, error }) => {
            if (error) {
              return AuthActions.loginFailure({ error });
            }
            if (data?.url) {
              return { type: '[Auth] OAuth Flow Initiated via Google' };
            }
            return AuthActions.loginFailure({ error: { name: 'OAuthError', message: 'Google sign-in did not immediately return a session or redirect URL.' } as any });
          }),
          catchError((error) => of(AuthActions.loginFailure({ error })))
        )
      )
    )
  );

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      exhaustMap((action) =>
        from(this.authService.signUp({ 
          email: action.email, 
          password: action.password,
          fullName: action.fullName 
        })).pipe(
          map(({ user, session, error }) => {
            if (error) {
              return AuthActions.registerFailure({ error });
            }
            // User might be non-null but session null if email confirmation is pending
            return AuthActions.registerSuccess({ user: user ?? null, session: session ?? null });
          }),
          catchError((error) => of(AuthActions.registerFailure({ error })))
        )
      )
    )
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      exhaustMap(() =>
        from(this.authService.signOut()).pipe(
          map(( {error} ) => {
            if (error) {
              return AuthActions.logoutFailure({ error });
            }
            return AuthActions.logoutSuccess();
          }),
          catchError((error) => of(AuthActions.logoutFailure({ error })))
        )
      )
    )
  );

  authSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess, AuthActions.registerSuccess),
      tap(({ session }) => {
        // Only redirect if the registration resulted in an active session
        // If email confirmation is required, session might be null initially
        if (session) {
            this.router.navigate(['/']); // Navigate to home or dashboard
        }
      })
    ),
    { dispatch: false } // No action is dispatched from this effect
  );

  logoutSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logoutSuccess),
      tap(() => {
        this.router.navigate(['/auth/login']); // Navigate to login page
      })
    ),
    { dispatch: false }
  );

} 