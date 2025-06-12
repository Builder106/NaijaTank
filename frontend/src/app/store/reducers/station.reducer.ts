import { createReducer, on } from '@ngrx/store';
import { Station, FuelStatus } from '../../core/models/station.model';
import * as StationActions from '../actions/station.actions';

export interface State {
  stations: Station[];
  selectedStation: Station | null;
  loading: boolean; // Global loading for list
  error: string | any | null; // Global error for list
  filters: {
    fuelType: string | null;
    maxDistance: number;
    maxPrice: number | null;
    hasAvailability: boolean;
  };
  // Individual station states (e.g. for detail loading or linking)
  stationStates: { [stationId: string]: { loadingDetails?: boolean; errorDetails?: any; linking?: boolean; errorLinking?: any } };
}

export const initialState: State = {
  stations: [],
  selectedStation: null,
  loading: false,
  error: null,
  filters: {
    fuelType: null,
    maxDistance: 20, // Default 20km radius
    maxPrice: null,
    hasAvailability: false
  },
  stationStates: {}
};

export const reducer = createReducer(
  initialState,
  
  on(StationActions.loadStations, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(StationActions.loadStationsSuccess, (state, { stations }) => ({
    ...state,
    stations: stations.map(s => ({ ...s, detailsFetched: s.source === 'db' ? true : (s.detailsFetched || false) })), // Assume DB stations have details
    loading: false
  })),
  
  on(StationActions.loadStationsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // When a station is selected, if it's Google-sourced and details not fetched, trigger fetch
  on(StationActions.selectStation, (state, { stationId }) => {
    const station = state.stations.find(s => s.id === stationId);
    return {
      ...state,
      selectedStation: station || null,
      // loading: true, // This loading was for loadStationDetails, which might be separate
      error: null
    };
  }),

  on(StationActions.clearSelectedStation, state => ({
    ...state,
    selectedStation: null,
    error: null
  })),
  
  on(StationActions.updateFilters, (state, { filters }) => ({
    ...state,
    filters: { ...state.filters, ...filters }
  })),

  // Handle loading old station details (mostly for DB stations now or already fetched Google ones)
  on(StationActions.loadStationDetails, (state, { stationId }) => ({
    ...state,
    stationStates: {
      ...state.stationStates,
      [stationId]: { ...state.stationStates[stationId], loadingDetails: true, errorDetails: null }
    }
  })),

  on(StationActions.loadStationDetailsSuccess, (state, { station }) => {
    if (!station) return { ...state, loading: false }; // Should not happen if an ID was passed
    return {
      ...state,
      stations: state.stations.map(s => s.id === station.id ? {...s, ...station, detailsFetched: true } : s),
      selectedStation: state.selectedStation?.id === station.id ? {...state.selectedStation, ...station, detailsFetched: true} : state.selectedStation,
      stationStates: {
        ...state.stationStates,
        [station.id]: { ...state.stationStates[station.id], loadingDetails: false, errorDetails: null }
      },
      loading: false // Clear global loading if any
    };
  }),
  
  on(StationActions.loadStationDetailsFailure, (state, { error }) => ({
    ...state,
    // We need stationId here to set error on specific station. Action needs update or use selectedStation.id
    // For now, setting global error, but this is not ideal.
    error: error, 
    loading: false
  })),

  // Google Place Details Fetching
  on(StationActions.triggerGooglePlaceDetailsFetch, StationActions.loadGooglePlaceDetails, (state, action: ({ stationId: string; placeId: string; } & {type: typeof StationActions.triggerGooglePlaceDetailsFetch.type}) | ({ stationIdToUpdate: string; placeId: string; } & {type: typeof StationActions.loadGooglePlaceDetails.type})) => {
    let idToUse: string;
    // placeId is common, can be accessed via action.placeId
    if (action.type === StationActions.triggerGooglePlaceDetailsFetch.type) {
      idToUse = action.stationId;
    } else { // type === StationActions.loadGooglePlaceDetails.type
      idToUse = action.stationIdToUpdate;
    }
    return {
      ...state,
      stationStates: {
        ...state.stationStates,
        [idToUse]: { ...state.stationStates[idToUse], loadingDetails: true, errorDetails: null }
      }
    };
  }),

  on(StationActions.loadGooglePlaceDetailsSuccess, (state, { stationIdToUpdate, details }) => ({
    ...state,
    stations: state.stations.map(s => 
      s.id === stationIdToUpdate ? { ...s, ...details, detailsFetched: true } : s
    ),
    selectedStation: state.selectedStation?.id === stationIdToUpdate 
      ? { ...state.selectedStation, ...details, detailsFetched: true } 
      : state.selectedStation,
    stationStates: {
      ...state.stationStates,
      [stationIdToUpdate]: { ...state.stationStates[stationIdToUpdate], loadingDetails: false }
    }
  })),

  on(StationActions.loadGooglePlaceDetailsFailure, (state, { stationIdToUpdate, error }) => ({
    ...state,
    stationStates: {
      ...state.stationStates,
      [stationIdToUpdate]: { ...state.stationStates[stationIdToUpdate], loadingDetails: false, errorDetails: error }
    }
  })),

  // Ensure Station Reference
  on(StationActions.ensureStationReference, (state, { station }) => ({
    ...state,
    stations: state.stations.map(s => 
      s.id === station.id ? { ...s, isLinking: true } : s
    ),
    selectedStation: state.selectedStation?.id === station.id 
      ? { ...state.selectedStation, isLinking: true } 
      : state.selectedStation,
    stationStates: {
      ...state.stationStates,
      [station.id]: { ...state.stationStates[station.id], linking: true, errorLinking: null }
    }
  })),

  on(StationActions.ensureStationReferenceSuccess, (state, { originalStationId, newStationId, updatedFields }) => {
    return {
      ...state,
      stations: state.stations.map(s =>
        s.id === originalStationId ? { ...s, ...updatedFields, id: newStationId, google_place_id: s.google_place_id || originalStationId, source: 'db' as const, isLinking: false, detailsFetched: true } : s
      ),
      selectedStation: state.selectedStation?.id === originalStationId
        ? { ...state.selectedStation, ...updatedFields, id: newStationId, google_place_id: state.selectedStation.google_place_id || originalStationId, source: 'db' as const, isLinking: false, detailsFetched: true }
        : state.selectedStation,
      stationStates: {
        ...state.stationStates,
        [originalStationId]: { ...state.stationStates[originalStationId], linking: false }, // Remove old state
        [newStationId]: { ...state.stationStates[newStationId], linking: false } // Add new state if needed
      }
    };
  }),

  on(StationActions.ensureStationReferenceFailure, (state, { originalStationId, error }) => ({
    ...state,
    stations: state.stations.map(s => 
      s.id === originalStationId ? { ...s, isLinking: false } : s
    ),
    selectedStation: state.selectedStation?.id === originalStationId 
      ? { ...state.selectedStation, isLinking: false } 
      : state.selectedStation,
    stationStates: {
      ...state.stationStates,
      [originalStationId]: { ...state.stationStates[originalStationId], linking: false, errorLinking: error }
    }
  })),
  
  on(StationActions.reportFuelStatusSuccess, (state, { stationId, report }) => {
    const mapFuelTypeToKey = (fuelType: 'petrol' | 'diesel' | 'kerosene' | 'gas'): keyof NonNullable<Station['fuelStatus']> | null => {
      switch (fuelType) {
        case 'petrol': return 'petrol';
        case 'diesel': return 'diesel';
        case 'kerosene': return 'kerosene';
        case 'gas': return 'gas';
        default:
          console.warn(`Unknown fuel type in report for mapping: ${fuelType}`);
          return null;
      }
    };

    const fuelKey = mapFuelTypeToKey(report.fuelType);
    if (!fuelKey) return state;

    const updatedStations = state.stations.map(station => {
      if (station.id === stationId) {
        const newFuelStatus: FuelStatus = {
          available: report.available,
          price: report.price,
          queueLength: report.queueLength,
          lastUpdated: new Date().toISOString()
        };
        return {
          ...station,
          fuelStatus: {
            ...station.fuelStatus,
            [fuelKey]: newFuelStatus
          },
          lastReported: new Date().toISOString()
        };
      }
      return station;
    });
    
    let updatedSelectedStation = state.selectedStation;
    if (state.selectedStation && state.selectedStation.id === stationId) {
      updatedSelectedStation = updatedStations.find(s => s.id === stationId) || null;
    }

    return {
      ...state,
      stations: updatedStations,
      selectedStation: updatedSelectedStation
    };
  })
);