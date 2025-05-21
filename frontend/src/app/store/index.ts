import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { environment } from '../../environments/environment';
import { authReducer, AuthState } from './reducers/auth.reducer';
import { isDevMode } from '@angular/core';

import * as fromStation from './reducers/station.reducer';
import * as fromUser from './reducers/user.reducer';
import * as fromGeolocation from './reducers/geolocation.reducer';
import * as fromUi from './reducers/ui.reducer';

export interface AppState {
  auth: AuthState;
  stations: fromStation.State;
  user: fromUser.State;
  geolocation: fromGeolocation.State;
  ui: fromUi.State;
}

export const reducers: ActionReducerMap<AppState> = {
  auth: authReducer,
  stations: fromStation.reducer,
  user: fromUser.reducer,
  geolocation: fromGeolocation.reducer,
  ui: fromUi.reducer
};

// Meta-reducer for logging in development (optional)
export function logger(reducer: (state: AppState | undefined, action: any) => AppState): (state: AppState | undefined, action: any) => AppState {
  return function(state: AppState | undefined, action: any): AppState {
    console.log('state', state);
    console.log('action', action);
    return reducer(state, action);
  };
}

export const metaReducers: MetaReducer<AppState>[] = !environment.production
  ? [logger] // Add logger only in development
  : [];