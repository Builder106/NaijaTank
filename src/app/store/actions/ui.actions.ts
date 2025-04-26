import { createAction, props } from '@ngrx/store';

export const showToast = createAction(
  '[UI] Show Toast',
  props<{ 
    message: string; 
    toastType: 'success' | 'error' | 'warning' | 'info';
  }>()
);

export const hideToast = createAction('[UI] Hide Toast');

export const toggleNavigation = createAction('[UI] Toggle Navigation');

export const setViewMode = createAction(
  '[UI] Set View Mode',
  props<{ mode: 'map' | 'list' }>()
);

export const setOfflineStatus = createAction(
  '[UI] Set Offline Status',
  props<{ isOffline: boolean }>()
);