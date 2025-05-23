import { createReducer, on } from '@ngrx/store';
import { Station, FuelStatus } from '../../core/models/station.model';
import * as StationActions from '../actions/station.actions';

export interface State {
  stations: Station[];
  selectedStation: Station | null;
  loading: boolean;
  error: string | any | null;
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
  
  on(StationActions.loadStations, StationActions.loadStationDetails, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(StationActions.loadStationsSuccess, (state, { stations }) => ({
    ...state,
    stations,
    loading: false
  })),
  
  on(StationActions.loadStationsFailure, StationActions.loadStationDetailsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  on(StationActions.loadStationDetailsSuccess, (state, { station }) => ({
    ...state,
    selectedStation: station || null,
    loading: false,
    error: null
  })),
  
  on(StationActions.selectStation, (state, { stationId }) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(StationActions.clearSelectedStation, state => ({
    ...state,
    selectedStation: null,
    error: null
  })),
  
  on(StationActions.updateFilters, (state, { filters }) => ({
    ...state,
    filters: { ...state.filters, ...filters }
  })),
  
  on(StationActions.reportFuelStatusSuccess, (state, { stationId, report }) => {
    const mapFuelTypeToKey = (fuelType: 'petrol' | 'diesel' | 'kerosene' | 'gas'): keyof Station['fuelStatus'] | null => {
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