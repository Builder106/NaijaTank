export interface FuelStatus {
  available: boolean;
  price: number | null;
  queueLength: 'None' | 'Short' | 'Medium' | 'Long' | null;
  lastUpdated: string; // ISO date string
}

export interface Station {
  id: string; // For DB stations, this is the internal ID. For Google-sourced, this might initially be the google_place_id before linking.
  name: string;
  brand: string | null; // Made nullable as Google results might not always have a brand aligned with NaijaTank's concept
  address: string | null; // Made nullable
  latitude: number;
  longitude: number;
  distance: number | null; // in kilometers from user
  reliabilityScore: number | null; // 1-5
  operatingHours: {
    open: string; // HH:MM format
    close: string; // HH:MM format
    is24Hours: boolean;
  } | null; // Made nullable
  fuelStatus: {
    petrol?: FuelStatus;
    diesel?: FuelStatus;
    kerosene?: FuelStatus;
    gas?: FuelStatus;
  } | null; // Made nullable
  contact: {
    phone: string | null;
    website: string | null;
  } | null; // Made nullable
  lastReported: string | null; // Made nullable
  reportCount: number | null;

  // New fields for hybrid data
  source?: 'db' | 'google';
  google_place_id?: string; // To store Google's unique Place ID
  // Consider if 'id' should always be your internal UUID after ensureStationReference, 
  // and google_place_id is just for the link. 
  // For now, `id` might be google_place_id for `source: 'google'` before it's linked.
}