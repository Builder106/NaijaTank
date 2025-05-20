import { createAction, props } from '@ngrx/store';
import { User } from '../../core/models/user.model';
import { FuelReport } from '../../core/models/fuel-report.model';

// Authentication
export const login = createAction(
  '[User] Login',
  props<{ phoneNumber: string; countryCode: string }>()
);

export const loginSuccess = createAction(
  '[User] Login Success',
  props<{ user: User }>()
);

export const loginFailure = createAction(
  '[User] Login Failure',
  props<{ error: string }>()
);

export const logout = createAction('[User] Logout');

export const logoutSuccess = createAction('[User] Logout Success');

export const logoutFailure = createAction(
  '[User] Logout Failure',
  props<{ error: string }>()
);

// Favorites
export const addToFavorites = createAction(
  '[User] Add To Favorites',
  props<{ stationId: string }>()
);

export const removeFromFavorites = createAction(
  '[User] Remove From Favorites',
  props<{ stationId: string }>()
);

export const loadFavorites = createAction('[User] Load Favorites');

export const loadFavoritesSuccess = createAction(
  '[User] Load Favorites Success',
  props<{ favorites: string[] }>()
);

// Reports
export const addReport = createAction(
  '[User] Add Report',
  props<{ report: FuelReport }>()
);

export const loadReports = createAction('[User] Load Reports');

export const loadReportsSuccess = createAction(
  '[User] Load Reports Success',
  props<{ reports: FuelReport[] }>()
);