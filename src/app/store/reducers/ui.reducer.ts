import { createReducer, on } from '@ngrx/store';
import * as UiActions from '../actions/ui.actions';

export interface State {
  toast: {
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  };
  navigationVisible: boolean;
  viewMode: 'map' | 'list';
  isOffline: boolean;
}

export const initialState: State = {
  toast: {
    visible: false,
    message: '',
    type: 'info'
  },
  navigationVisible: true,
  viewMode: 'map',
  isOffline: false
};

export const reducer = createReducer(
  initialState,
  
  on(UiActions.showToast, (state, { message, type }) => ({
    ...state,
    toast: {
      visible: true,
      message,
      type
    }
  })),
  
  on(UiActions.hideToast, state => ({
    ...state,
    toast: {
      ...state.toast,
      visible: false
    }
  })),
  
  on(UiActions.toggleNavigation, state => ({
    ...state,
    navigationVisible: !state.navigationVisible
  })),
  
  on(UiActions.setViewMode, (state, { mode }) => ({
    ...state,
    viewMode: mode
  })),
  
  on(UiActions.setOfflineStatus, (state, { isOffline }) => ({
    ...state,
    isOffline
  }))
);