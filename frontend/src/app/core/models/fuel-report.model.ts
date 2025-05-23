export interface FuelReport {
  id?: string;
  stationId: string;
  userId: string;
  fuelType: 'petrol' | 'diesel' | 'kerosene' | 'gas';
  available: boolean;
  price: number | null;
  queueLength: 'None' | 'Short' | 'Medium' | 'Long' | null;
  comment?: string;
  photoUrl?: string;
  timestamp: string; // ISO date string
}