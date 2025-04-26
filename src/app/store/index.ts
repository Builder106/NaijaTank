import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { isDevMode } from '@angular/core';

import * as fromStation from './reducers/station.reducer';
import * as fromUser from './reducers/user.reducer';
import * as fromGeolocation from './reducers/geolocation.reducer';
import * as fromUi from './reducers/ui.reducer';

export interface AppState {
  stations: fromStation.State;
  user: fromUser.State;
  geolocation: fromGeolocation.State;
  ui: fromUi.State;
}

export const reducers: ActionReducerMap<AppState> = {
  stations: fromStation.reducer,
  user: fromUser.reducer,
  geolocation: fromGeolocation.reducer,
  ui: fromUi.reducer
};

export const metaReducers: MetaReducer<AppState>[] = isDevMode() ? [] : [];