import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap, exhaustMap } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import * as AuthActions from '../actions/auth.actions';
import { Router } from '@angular/router';
import { SignInWithPasswordCredentials, SignUpWithPasswordCredentials, User, Session, AuthError } from '@supabase/supabase-js';

// TODO: Fix errors
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
        this.authService.signInWithEmail(action.email, action.password).pipe(
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
        this.authService.signInWithGoogle().pipe(
          map(({ user, session, error }) => {
            if (error) {
              return AuthActions.loginFailure({ error });
            }
            // For OAuth, Supabase handles session via redirect. The onAuthStateChange listener
            // in AuthService will dispatch sessionUpdate. So, this success action might primarily be for navigation or UI updates.
            // However, if the signInWithGoogle() itself can return user/session directly (e.g. if user already approved)
            if (user && session) {
                 return AuthActions.loginSuccess({ user, session });
            }
            // If it only initiates redirect, we might not dispatch loginSuccess here directly
            // but rely on onAuthStateChange. For now, let's assume it can return if session already exists.
            // If not, this part needs adjustment based on actual Supabase behavior for immediate returns from OAuth calls.
            return AuthActions.loginFailure({ error: { name: 'OAuthError', message: 'Google sign-in did not immediately return a session.' } as any });
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
        this.authService.signUpWithEmail(action.email, action.password).pipe(
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
        this.authService.signOut().pipe(
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

  listenToAuthChanges$ = createEffect(() =>
    this.authService.onAuthStateChange().pipe(
      map(({ event, session }) => {
        console.log('Auth event:', event, 'Session:', session);
        const user = session?.user ?? null;
        return AuthActions.sessionUpdate({ user, session });
      })
    )
  );

  checkAuthSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.checkAuthSession, AuthActions.setInitialAuthState), // setInitialAuthState is for when app loads
      switchMap(() => this.authService.getCurrentSession().pipe(
        map(session => {
          const user = session?.user ?? null;
          return AuthActions.sessionUpdate({ user, session });
        }),
        catchError(() => of(AuthActions.sessionUpdate({ user: null, session: null }))) // On error, assume no session
      ))
    )
  );

} 