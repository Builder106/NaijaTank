import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AppState } from '..'; // Assuming AppState is in the parent directory index.ts

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: any | null;
}

export const selectGeolocationState = createFeatureSelector<AppState, GeolocationState>('geolocation');

export const selectCurrentPosition = createSelector(
  selectGeolocationState,
  (state: GeolocationState) => ({ latitude: state.latitude, longitude: state.longitude })
);

export const selectGeolocationLoading = createSelector(
  selectGeolocationState,
  (state: GeolocationState) => state.loading
);

export const selectGeolocationError = createSelector(
  selectGeolocationState,
  (state: GeolocationState) => state.error
); 