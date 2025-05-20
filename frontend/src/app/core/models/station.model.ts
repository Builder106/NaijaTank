export interface FuelStatus {
  available: boolean;
  price: number | null;
  queueLength: 'None' | 'Short' | 'Medium' | 'Long' | null;
  lastUpdated: string; // ISO date string
}

export interface Station {
  id: string;
  name: string;
  brand: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number; // in kilometers from user
  reliabilityScore: number; // 1-5
  operatingHours: {
    open: string; // HH:MM format
    close: string; // HH:MM format
    is24Hours: boolean;
  };
  fuelStatus: {
    pms: FuelStatus; // Premium Motor Spirit (Petrol)
    diesel: FuelStatus;
    kerosene: FuelStatus;
  };
  contact: {
    phone: string | null;
    website: string | null;
  };
  lastReported: string; // ISO date string
  reportCount: number;
}