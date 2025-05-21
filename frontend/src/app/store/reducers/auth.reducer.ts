import { createReducer, on } from '@ngrx/store';
import { User, Session, AuthError } from '@supabase/supabase-js';
import * as AuthActions from '../actions/auth.actions';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: AuthError | null;
}

export const initialState: AuthState = {
  user: null,
  session: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const authReducer = createReducer(
  initialState,
  on(AuthActions.login, AuthActions.register, AuthActions.loginWithGoogle, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(AuthActions.loginSuccess, AuthActions.registerSuccess, AuthActions.sessionUpdate, (state, { user, session }) => ({
    ...state,
    user,
    session,
    isAuthenticated: !!session, // True if session exists, false otherwise
    loading: false,
    error: null,
  })),
  on(AuthActions.loginFailure, AuthActions.registerFailure, AuthActions.logoutFailure, (state, { error }) => ({
    ...state,
    user: null,
    session: null,
    isAuthenticated: false,
    loading: false,
    error,
  })),
  on(AuthActions.logoutSuccess, (state) => ({
    ...initialState, // Reset to initial state on logout
  })),
  on(AuthActions.logout, (state) => ({
    ...state,
    loading: true,
  })),
  on(AuthActions.checkAuthSession, (state) => ({
    ...state,
    loading: true, // Potentially set loading to true while checking
  })),
  on(AuthActions.clearAuthError, (state) => ({
    ...state,
    error: null,
  })),
   on(AuthActions.setInitialAuthState, (state) => {
    // This action could be used to restore state from localStorage or similar
    // For now, just ensure loading is false if we are setting an initial state
    // Actual state restoration would happen in an effect or app initializer
    return { ...state, loading: false };
  })
); 