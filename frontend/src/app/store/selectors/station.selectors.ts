import { createFeatureSelector, createSelector } from '@ngrx/store';
import { Station } from '../../core/models/station.model';

// Define the shape of your StationState. 
// This should match how it's defined in your reducers and AppState.
export interface StationState {
  stations: Station[];
  selectedStation: Station | null; // Changed from selectedStationId for consistency with reducer
  loading: boolean;
  error: string | any | null; // Keep any for flexibility, though specific error types are better
  filters: {
    fuelType?: string | null;
    maxDistance?: number;
    maxPrice?: number | null;
    hasAvailability?: boolean;
  };
  stationStates: { 
    [stationId: string]: { 
      loadingDetails?: boolean; 
      errorDetails?: any; 
      linking?: boolean; 
      errorLinking?: any; 
    } 
  };
}

// Feature selector for the 'stations' slice of state
// Make sure 'stations' matches the key used in StoreModule.forFeature()
export const selectStationsFeatureState = createFeatureSelector<StationState>('stations');

// Selector for all stations
export const selectAllStations = createSelector(
  selectStationsFeatureState,
  (state: StationState) => state.stations
);

// Selector for the global loading state (for station list)
export const selectStationsLoading = createSelector(
  selectStationsFeatureState,
  (state: StationState) => state.loading
);

// Selector for any global error messages (for station list)
export const selectStationsError = createSelector(
  selectStationsFeatureState,
  (state: StationState) => state.error
);

// Selector for current station filters
export const selectStationFilters = createSelector(
  selectStationsFeatureState,
  (state: StationState) => state.filters
);

// Selector for the currently selected station object
export const selectCurrentStation = createSelector(
  selectStationsFeatureState,
  (state: StationState) => state.selectedStation
);

// Selector for the stationStates map
export const selectStationStates = createSelector(
  selectStationsFeatureState,
  (state: StationState) => state.stationStates
);

// Selector to get the state for a specific station by its ID
export const selectStationStateById = (stationId: string) => createSelector(
  selectStationStates,
  (stationStates) => stationStates[stationId] || {} // Return empty object if no state for ID
);

// Selector to get details loading status for a specific station
export const selectStationDetailsLoading = (stationId: string) => createSelector(
  selectStationStateById(stationId),
  (stationState) => !!stationState.loadingDetails // Coerce to boolean
);

// Selector to get details error for a specific station
export const selectStationDetailsError = (stationId: string) => createSelector(
  selectStationStateById(stationId),
  (stationState) => stationState.errorDetails
);

// Selector to get linking status for a specific station
export const selectStationLinking = (stationId: string) => createSelector(
  selectStationStateById(stationId),
  (stationState) => !!stationState.linking // Coerce to boolean
);

// Selector to get linking error for a specific station
export const selectStationLinkingError = (stationId: string) => createSelector(
  selectStationStateById(stationId),
  (stationState) => stationState.errorLinking
); 