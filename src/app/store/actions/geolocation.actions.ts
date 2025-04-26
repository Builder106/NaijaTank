import { createAction, props } from '@ngrx/store';

export const initGeolocation = createAction(
  '[Geolocation] Initialize Geolocation'
);

export const geolocationSuccess = createAction(
  '[Geolocation] Geolocation Success',
  props<{ position: GeolocationPosition }>()
);

export const geolocationFailure = createAction(
  '[Geolocation] Geolocation Failure',
  props<{ error: string }>()
);

export const setManualLocation = createAction(
  '[Geolocation] Set Manual Location',
  props<{ latitude: number; longitude: number }>()
);