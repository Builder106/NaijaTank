import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store, createAction, props } from '@ngrx/store';
import { EMPTY, of } from 'rxjs';
import { map, exhaustMap, catchError, switchMap, withLatestFrom, tap, filter } from 'rxjs/operators';
import { StationService } from '../../core/services/station.service';
import * as StationActions from '../actions/station.actions';
import { AppState } from '../index'; // Assuming your root AppState is here
import { selectStationFilters } from '../selectors/station.selectors'; // We'll need to create this selector
import { Station } from '../../core/models/station.model'; // Import Station model

@Injectable()
export class StationEffects {

  loadStations$ = createEffect(() => this.actions$.pipe(
    ofType(StationActions.loadStations), // Primarily triggered by loadStations
    // If updateFilters should also reload stations with new geo-params, it needs to dispatch loadStations
    // or this effect needs to listen to updateFilters and somehow get current geo-params.
    // For now, simplifying to loadStations being the primary trigger with all necessary params.
    exhaustMap(action => {
      // Directly use payload from loadStations action
      return this.stationService.getStations(
        action.latitude,
        action.longitude,
        action.radiusKm,
        action.fuelTypes, // Pass along if provided
        action.keyword    // Pass along if provided
      ).pipe(
        map((stations: Station[]) => StationActions.loadStationsSuccess({ stations })),
        catchError(error => of(StationActions.loadStationsFailure({ error: error.message || 'Failed to load stations' })))
      );
    })
  ));

  // Effect for explicit full detail load of a station (e.g., DB station or refresh)
  loadStationDetails$ = createEffect(() => this.actions$.pipe(
    ofType(StationActions.loadStationDetails),
    switchMap(action => 
      // This service method might need to be more intelligent or a different one called
      // depending on whether it's a DB station or an already-linked Google one.
      // For now, assume getStationById handles fetching full details for known IDs.
      this.stationService.getStationById(action.stationId).pipe( 
        map(station => StationActions.loadStationDetailsSuccess({ station })),
        catchError(error => of(StationActions.loadStationDetailsFailure({ error: error.message || 'Failed to load station details' })))
      )
    )
  ));

  // Effect to trigger the loading of Google Place Details
  triggerGooglePlaceDetailsFetch$ = createEffect(() => this.actions$.pipe(
    ofType(StationActions.triggerGooglePlaceDetailsFetch),
    map(action => StationActions.loadGooglePlaceDetails({ 
      stationIdToUpdate: action.stationId, // This is the ID in the store (might be google_place_id initially)
      placeId: action.placeId 
    }))
  ));

  // Effect to actually load Google Place Details from the service
  loadGooglePlaceDetails$ = createEffect(() => this.actions$.pipe(
    ofType(StationActions.loadGooglePlaceDetails),
    switchMap(action => 
      this.stationService.getGooglePlaceDetails(action.placeId).pipe(
        map(details => StationActions.loadGooglePlaceDetailsSuccess({ 
          stationIdToUpdate: action.stationIdToUpdate,
          details // Expecting service to return Partial<Station>
        })),
        catchError(error => of(StationActions.loadGooglePlaceDetailsFailure({ 
          stationIdToUpdate: action.stationIdToUpdate,
          error: error.message || 'Failed to load Google Place details' 
        })))
      )
    )
  ));

  // Effect to ensure station reference for Google-sourced stations
  ensureStationReference$ = createEffect(() => this.actions$.pipe(
    ofType(StationActions.ensureStationReference),
    switchMap(action => {
      if (!action.station.google_place_id) {
        // Should not happen if this action is dispatched correctly
        return of(StationActions.ensureStationReferenceFailure({ 
          originalStationId: action.station.id, 
          error: 'Missing google_place_id for ensureStationReference',
          onFailureDispatchAction: action.onFailureDispatchAction // Pass through
        }));
      }
      return this.stationService.ensureStationReference(action.station.google_place_id).pipe(
        map(response => StationActions.ensureStationReferenceSuccess({
          originalStationId: action.station.id,
          newStationId: response.station_id,
          updatedFields: { 
            id: response.station_id,
            google_place_id: action.station.google_place_id,
            source: 'db',
            detailsFetched: true,
            isLinking: false
          },
          onSuccessDispatchAction: action.onSuccessDispatchAction // Pass through
        })),
        catchError(error => of(StationActions.ensureStationReferenceFailure({ 
          originalStationId: action.station.id,
          error: error.message || 'Failed to ensure station reference',
          onFailureDispatchAction: action.onFailureDispatchAction // Pass through
        })))
      );
    })
  ));

  // Effect to handle dispatching onSuccessDispatchAction after successful station linking
  handlePostStationLinkSuccessActions$ = createEffect(() => this.actions$.pipe(
    ofType(StationActions.ensureStationReferenceSuccess),
    map(action => {
      if (action.onSuccessDispatchAction) {
        let payload: Record<string, any> = action.onSuccessDispatchAction.payload;
        // If payload needs the newStationId, replace a placeholder
        if (payload && typeof payload === 'object' && payload['stationId'] === 'USE_NEW_STATION_ID') {
          payload = { ...payload, stationId: action.newStationId };
        }
        return createAction(action.onSuccessDispatchAction.type, props<Record<string, any>>())(payload);
      }
      return null;
    }),
    filter(action => action !== null)
  ));

  // Effect to handle dispatching onFailureDispatchAction after failed station linking
  handlePostStationLinkFailureActions$ = createEffect(() => this.actions$.pipe(
    ofType(StationActions.ensureStationReferenceFailure),
    map(action => {
      if (action.onFailureDispatchAction) {
        return createAction(action.onFailureDispatchAction.type, props<Record<string, any>>())(action.onFailureDispatchAction.payload);
      }
      return null;
    }),
    filter(action => action !== null)
  ));

//   reportFuelStatus effect (if needed for things like toast notifications)
//   Example:
//   reportFuelSuccess$ = createEffect(() => this.actions$.pipe(
//     ofType(StationActions.reportFuelStatusSuccess),
//     tap(() => {
//       // this.toastService.show('Report submitted successfully!');
//     })
//   ), { dispatch: false });

  constructor(
    private actions$: Actions,
    private stationService: StationService,
    private store: Store<AppState> // Inject the store
  ) {}
}