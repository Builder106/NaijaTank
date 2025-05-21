import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from '../reducers/auth.reducer';

// Feature selector for the auth state
export const selectAuthState = createFeatureSelector<AuthState>('auth'); // 'auth' should match the key in StoreModule.forFeature()

// Selector for the current user
export const selectCurrentUser = createSelector(
  selectAuthState,
  (state: AuthState) => state.user
);

// Selector for the current session
export const selectCurrentSession = createSelector(
  selectAuthState,
  (state: AuthState) => state.session
);

// Selector for the authentication status
export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (state: AuthState) => state.isAuthenticated
);

// Selector for the loading state
export const selectAuthLoading = createSelector(
  selectAuthState,
  (state: AuthState) => state.loading
);

// Selector for any authentication error
export const selectAuthError = createSelector(
  selectAuthState,
  (state: AuthState) => state.error
);

// Selector to get both user and authentication status, useful for guards
export const selectUserAndAuthStatus = createSelector(
    selectCurrentUser,
    selectIsAuthenticated,
    (user, isAuthenticated) => ({ user, isAuthenticated })
); 