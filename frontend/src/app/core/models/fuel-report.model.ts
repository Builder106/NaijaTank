export interface FuelReport {
  id?: string;
  stationId: string;
  userId: string;
  fuelType: 'pms' | 'diesel' | 'kerosene';
  available: boolean;
  price: number | null;
  queueLength: 'None' | 'Short' | 'Medium' | 'Long' | null;
  comment?: string;
  photoUrl?: string;
  timestamp: string; // ISO date string
}