import { createReducer, on } from '@ngrx/store';
import * as GeolocationActions from '../actions/geolocation.actions';

export interface State {
  currentPosition: {
    latitude: number | null;
    longitude: number | null;
  };
  loading: boolean;
  error: string | null;
  permissionGranted: boolean | null;
}

export const initialState: State = {
  currentPosition: {
    latitude: null,
    longitude: null
  },
  loading: false,
  error: null,
  permissionGranted: null
};

export const reducer = createReducer(
  initialState,
  
  on(GeolocationActions.initGeolocation, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(GeolocationActions.geolocationSuccess, (state, { position }) => ({
    ...state,
    currentPosition: {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    },
    loading: false,
    permissionGranted: true
  })),
  
  on(GeolocationActions.geolocationFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
    permissionGranted: false
  })),
  
  on(GeolocationActions.setManualLocation, (state, { latitude, longitude }) => ({
    ...state,
    currentPosition: {
      latitude,
      longitude
    },
    loading: false
  }))
);