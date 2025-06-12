import { createAction, props } from '@ngrx/store';
import { Station } from '../../core/models/station.model';
import { FuelReport } from '../../core/models/fuel-report.model';

// Load Stations
export const loadStations = createAction(
  '[Station] Load Stations',
  props<{ 
    latitude: number;
    longitude: number;
    radiusKm: number;
    fuelTypes?: string[];
    keyword?: string;
  }>()
);

export const loadStationsSuccess = createAction(
  '[Station] Load Stations Success',
  props<{ stations: Station[] }>()
);

export const loadStationsFailure = createAction(
  '[Station] Load Stations Failure',
  props<{ error: string }>()
);

// Select Station
export const selectStation = createAction(
  '[Station] Select Station',
  props<{ stationId: string }>()
);

export const clearSelectedStation = createAction(
  '[Station] Clear Selected Station'
);

// Filters
export const updateFilters = createAction(
  '[Station] Update Filters',
  props<{ 
    filters: {
      fuelType?: string | null;
      maxDistance?: number;
      maxPrice?: number | null;
      hasAvailability?: boolean;
    } 
  }>()
);

// Report Fuel Status
export const reportFuelStatus = createAction(
  '[Station] Report Fuel Status',
  props<{ 
    stationId: string;
    report: FuelReport;
  }>()
);

export const reportFuelStatusSuccess = createAction(
  '[Station] Report Fuel Status Success',
  props<{ 
    stationId: string;
    report: FuelReport;
  }>()
);

export const reportFuelStatusFailure = createAction(
  '[Station] Report Fuel Status Failure',
  props<{ error: string }>()
);

// Load Single Station Details (for selected station)
export const loadStationDetails = createAction(
  '[Station] Load Station Details',
  props<{ stationId: string; fuelTypes?: string[] }>() // fuelTypes can be passed if needed
);

export const loadStationDetailsSuccess = createAction(
  '[Station API] Load Station Details Success',
  props<{ station: Station | undefined }>()
);

export const loadStationDetailsFailure = createAction(
  '[Station API] Load Station Details Failure',
  props<{ error: any }>()
);

// New Actions for Google Place Details
export const triggerGooglePlaceDetailsFetch = createAction(
  '[Station] Trigger Google Place Details Fetch',
  props<{ stationId: string; placeId: string; }>() // stationId is the ID in store (could be google_place_id)
);

export const loadGooglePlaceDetails = createAction(
  '[Station API] Load Google Place Details',
  props<{ stationIdToUpdate: string; placeId: string; }>() 
);

export const loadGooglePlaceDetailsSuccess = createAction(
  '[Station API] Load Google Place Details Success',
  // Partial<Station> to merge into existing station data
  props<{ stationIdToUpdate: string; details: Partial<Station> }>() 
);

export const loadGooglePlaceDetailsFailure = createAction(
  '[Station API] Load Google Place Details Failure',
  props<{ stationIdToUpdate: string; error: any }>()
);

// Updated Actions for Ensuring Station Reference with action chaining support
export const ensureStationReference = createAction(
  '[Station] Ensure Station Reference',
  props<{ 
    station: Station; 
    onSuccessDispatchAction?: { type: string; payload?: any };
    onFailureDispatchAction?: { type: string; payload?: any };
  }>()
);

export const ensureStationReferenceSuccess = createAction(
  '[Station API] Ensure Station Reference Success',
  props<{ 
    originalStationId: string; 
    newStationId: string;     
    updatedFields: Partial<Station>;
    onSuccessDispatchAction?: { type: string; payload?: any }; // Carried over
  }>()
);

export const ensureStationReferenceFailure = createAction(
  '[Station API] Ensure Station Reference Failure',
  props<{ 
    originalStationId: string; 
    error: any; 
    onFailureDispatchAction?: { type: string; payload?: any }; // Carried over
  }>()
);