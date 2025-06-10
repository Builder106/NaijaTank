// Re-export from the central shared location
export { GasStationBrand } from "../../../shared/enums.ts";

// Define a more specific type for fuel prices
export interface FuelPrices {
  petrol?: number | null;
  diesel?: number | null;
  kerosene?: number | null;
  gas?: number | null;
}

// You can add other shared types or enums here in the future that are specific to Supabase functions
// or re-export other centrally shared types.