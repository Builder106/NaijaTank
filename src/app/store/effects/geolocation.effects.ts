import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { from, of } from 'rxjs';
import * as GeolocationActions from '../actions/geolocation.actions';
import * as UiActions from '../actions/ui.actions';
import * as StationActions from '../actions/station.actions';

@Injectable()
export class GeolocationEffects {
  initGeolocation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GeolocationActions.initGeolocation),
      switchMap(() =>
        from(
          new Promise<GeolocationPosition>((resolve, reject) => {
            if (!navigator.geolocation) {
              reject('Geolocation is not supported by this browser');
            }
            
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            });
          })
        ).pipe(
          map(position => GeolocationActions.geolocationSuccess({ position })),
          catchError(error => 
            of(GeolocationActions.geolocationFailure({ 
              error: error.message || 'Failed to get location' 
            }))
          )
        )
      )
    )
  );

  geolocationSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GeolocationActions.geolocationSuccess),
      map(({ position }) => 
        StationActions.loadStations({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      )
    )
  );

  geolocationFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GeolocationActions.geolocationFailure),
      map(({ error }) => 
        UiActions.showToast({ 
          message: `Location access failed: ${error}. Please enable location or enter your address manually.`, 
          type: 'warning' 
        })
      )
    )
  );

  setManualLocation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GeolocationActions.setManualLocation),
      map(({ latitude, longitude }) => 
        StationActions.loadStations({ latitude, longitude })
      )
    )
  );

  constructor(private actions$: Actions) {}
}