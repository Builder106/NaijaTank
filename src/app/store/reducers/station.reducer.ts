import { createReducer, on } from '@ngrx/store';
import { Station } from '../../core/models/station.model';
import * as StationActions from '../actions/station.actions';

export interface State {
  stations: Station[];
  selectedStation: Station | null;
  loading: boolean;
  error: string | null;
  filters: {
    fuelType: string | null;
    maxDistance: number;
    maxPrice: number | null;
    hasAvailability: boolean;
  };
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
  }
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
    stations,
    loading: false
  })),
  
  on(StationActions.loadStationsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  on(StationActions.selectStation, (state, { stationId }) => ({
    ...state,
    selectedStation: state.stations.find(station => station.id === stationId) || null
  })),
  
  on(StationActions.clearSelectedStation, state => ({
    ...state,
    selectedStation: null
  })),
  
  on(StationActions.updateFilters, (state, { filters }) => ({
    ...state,
    filters: { ...state.filters, ...filters }
  })),
  
  on(StationActions.reportFuelStatusSuccess, (state, { stationId, report }) => {
    const updatedStations = state.stations.map(station => {
      if (station.id === stationId) {
        return {
          ...station,
          fuelStatus: {
            ...station.fuelStatus,
            [report.fuelType]: {
              available: report.available,
              price: report.price,
              queueLength: report.queueLength,
              lastUpdated: new Date().toISOString()
            }
          },
          lastReported: new Date().toISOString()
        };
      }
      return station;
    });
    
    return {
      ...state,
      stations: updatedStations,
      selectedStation: state.selectedStation && state.selectedStation.id === stationId
        ? updatedStations.find(s => s.id === stationId) || null
        : state.selectedStation
    };
  })
);