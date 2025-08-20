import { createAction, props } from '@ngrx/store';
import { User, Session, AuthError } from '@supabase/supabase-js';

// Login Actions
export const login = createAction('[Auth] Login', props<{ email: string; password: string }>());
export const loginWithGoogle = createAction('[Auth] Login with Google');
export const loginSuccess = createAction('[Auth] Login Success', props<{ user: User; session: Session }>());
export const loginFailure = createAction('[Auth] Login Failure', props<{ error: AuthError }>());

// Registration Actions
export const register = createAction('[Auth] Register', props<{ email: string; password: string; fullName: string }>());
export const registerSuccess = createAction('[Auth] Register Success', props<{ user: User | null; session: Session | null }>()); // User might be null if email confirmation is required
export const registerFailure = createAction('[Auth] Register Failure', props<{ error: AuthError }>());

// Logout Actions
export const logout = createAction('[Auth] Logout');
export const logoutSuccess = createAction('[Auth] Logout Success');
export const logoutFailure = createAction('[Auth] Logout Failure', props<{ error: AuthError }>());

// Session Management Actions
export const checkAuthSession = createAction('[Auth] Check Auth Session');
export const sessionUpdate = createAction('[Auth] Session Update', props<{ user: User | null; session: Session | null }>());
export const clearAuthError = createAction('[Auth] Clear Auth Error');
export const setInitialAuthState = createAction('[Auth] Set Initial Auth State'); 