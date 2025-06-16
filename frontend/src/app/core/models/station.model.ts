import { GasStationBrand } from '@shared/enums';
import { FuelPrices } from '@shared/types';

export interface FuelStatus {
  available: boolean;
  price: number | null;
  queueLength: 'None' | 'Short' | 'Medium' | 'Long' | null;
  lastUpdated: string; // ISO date string
}

export interface Station {
  id: string; // For DB stations, this is the internal ID. For Google-sourced, this might initially be the google_place_id before linking.
  name: string;
  brand: GasStationBrand | null; // Changed from string to GasStationBrand enum
  address: string | null;
  latitude: number;
  longitude: number;
  distance: number | null; // in kilometers from user
  reliabilityScore: number | null; // 1-5
  operatingHours: {
    open: string; // HH:MM format
    close: string; // HH:MM format
    is24Hours: boolean;
  } | null;
  fuelStatus: {
    petrol?: FuelStatus;
    diesel?: FuelStatus;
    kerosene?: FuelStatus;
    gas?: FuelStatus;
  } | null;
  contact: {
    phone: string | null;
    website: string | null; // Will also be populated from brandLookupTable if available
  } | null;
  lastReported: string | null;
  reportCount: number | null;

  // New fields for hybrid data & Google Places integration
  source?: 'db' | 'google';
  google_place_id?: string; // To store Google's unique Place ID
  logoUrl?: string | null; // For brand logo, e.g., from Brandfetch via brand-details
  website?: string | null; // Station specific website from Google, or brand website as fallback
  rawFuelPrices?: FuelPrices | null; // To store fuel prices as returned by nearby-stations (typically default brand prices)
  types?: string[]; // Google Place types
  detailsFetched?: boolean; // Flag to indicate if full Google Place Details have been fetched
  isLinking?: boolean; // Flag to indicate if ensureStationReference is in progress for this station
  isFavorite?: boolean; // Flag to indicate if the station is marked as favorite by the user
}