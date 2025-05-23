import { createFeatureSelector, createSelector } from '@ngrx/store';
import { Station } from '../../core/models/station.model';

// Define the shape of your StationState. 
// This should match how it's defined in your reducers and AppState.
export interface StationState {
  stations: Station[];
  selectedStationId: string | null; // Or selectedStation: Station | null directly
  loading: boolean;
  error: string | null;
  filters: {
    fuelType?: string | null;
    maxDistance?: number;
    maxPrice?: number | null;
    hasAvailability?: boolean;
  };
  // If selectedStation is an object not just an ID:
  selectedStation?: Station | null; 
}

// Feature selector for the 'stations' slice of state
export const selectStationsFeatureState = createFeatureSelector<StationState>('stations');

// Selector for all stations
export const selectAllStations = createSelector(
  selectStationsFeatureState,
  (state: StationState) => state.stations
);

// Selector for the loading state
export const selectStationsLoading = createSelector(
  selectStationsFeatureState,
  (state: StationState) => state.loading
);

// Selector for any error messages
export const selectStationsError = createSelector(
  selectStationsFeatureState,
  (state: StationState) => state.error
);

// Selector for current station filters
export const selectStationFilters = createSelector(
  selectStationsFeatureState,
  (state: StationState) => state.filters
);

// Selector for the currently selected station (if you store the whole object)
export const selectCurrentStation = createSelector(
  selectStationsFeatureState,
  (state: StationState) => state.selectedStation // or find from stations array if only ID is stored
);

// Example if you only store selectedStationId:
// export const selectCurrentStationId = createSelector(
//   selectStationsFeatureState,
//   (state: StationState) => state.selectedStationId
// );

// export const selectCurrentStation = createSelector(
//   selectAllStations,
//   selectCurrentStationId,
//   (stations, selectedId) => stations.find(station => station.id === selectedId) || null
// ); 