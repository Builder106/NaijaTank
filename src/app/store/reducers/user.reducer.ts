import { createReducer, on } from '@ngrx/store';
import { User } from '../../core/models/user.model';
import * as UserActions from '../actions/user.actions';

export interface State {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  reports: any[];
  favorites: string[]; // Station IDs
}

export const initialState: State = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  reports: [],
  favorites: []
};

export const reducer = createReducer(
  initialState,
  
  on(UserActions.login, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(UserActions.loginSuccess, (state, { user }) => ({
    ...state,
    user,
    isAuthenticated: true,
    loading: false
  })),
  
  on(UserActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  on(UserActions.logout, state => ({
    ...state,
    loading: true
  })),
  
  on(UserActions.logoutSuccess, () => ({
    ...initialState
  })),
  
  on(UserActions.addToFavorites, (state, { stationId }) => ({
    ...state,
    favorites: [...state.favorites, stationId]
  })),
  
  on(UserActions.removeFromFavorites, (state, { stationId }) => ({
    ...state,
    favorites: state.favorites.filter(id => id !== stationId)
  })),
  
  on(UserActions.addReport, (state, { report }) => ({
    ...state,
    reports: [report, ...state.reports]
  }))
);