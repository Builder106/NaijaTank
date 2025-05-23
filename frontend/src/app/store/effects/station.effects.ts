import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store, select } from '@ngrx/store';
import { EMPTY, of } from 'rxjs';
import { map, exhaustMap, catchError, switchMap, withLatestFrom } from 'rxjs/operators';
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

  // Effect to handle selecting a station and fetching its details
  // This is triggered when a station is selected, perhaps from a list or map marker click
  loadSelectedStationDetails$ = createEffect(() => this.actions$.pipe(
    ofType(StationActions.selectStation),
    switchMap(action => {
      // For source: 'google', getStationById will currently return undefined quickly.
      // Actual fetching of Google details will need a separate mechanism or enhancement of getStationById.
      // For source: 'db', it uses the existing RPC.
      // We need to pass the 'source' if known, or getStationById might need to determine it.
      // For now, assuming ID is for a DB station if source isn't explicitly google.
      // This part will need more robust handling based on UI flow.
      return this.stationService.getStationById(action.stationId /*, source */).pipe( 
        map(station => StationActions.loadStationDetailsSuccess({ station })),
        catchError(error => of(StationActions.loadStationDetailsFailure({ error: error.message || 'Failed to load station details' })))
      );
    })
  ));

  // You might also want an effect for reportFuelStatus if it has side effects other than just API call,
  // or if you want to dispatch additional actions upon success/failure (e.g., show a toast).
  // For now, assuming submitFuelReport in service is self-contained enough for direct calls from components/facades.

  constructor(
    private actions$: Actions,
    private stationService: StationService,
    private store: Store<AppState> // Inject the store
  ) {}
}