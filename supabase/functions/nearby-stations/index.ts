// TODO: Use latest JSR packages
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GasStationBrand } from "../_shared/types.ts"; // Import the enum

const PLACES_API_URL = "https://places.googleapis.com/v1/places:searchNearby";

// --- START NEW TYPE DEFINITIONS ---
interface GeoJsonPoint {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

interface DbStation {
  id: string;
  name: string;
  brand: string; // Assuming DB might store brand as string initially or it's also an enum there
  address: string;
  city: string;
  state: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  location: GeoJsonPoint;
  created_at: string;
  updated_at: string;
  google_place_id: string;
  source_type: string;
}

// interface GooglePlaceGeometry {
//   location?: {
//     latitude: number;
//     longitude: number;
//   };
//   // Other geometry fields like viewport if needed
// }

interface GooglePlaceResultItem {
  id: string;
  displayName: {
    text: string;
    languageCode: string;
  };
  formattedAddress?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  vicinity?: string;
  types?: string[];
  // Add other fields you might use from Google, e.g., photos, rating, business_status
}

interface GooglePlacesApiResponse {
  places: GooglePlaceResultItem[];
  // status: string; // Removed as it's not directly in the `places` array structure shown in docs for successful response
  // error_message?: string; // Removed
  // next_page_token?: string; // Removed, handle pagination if needed based on full API response structure
}

interface GoogleApiRequestBody { // New interface for the Google API request body
  includedTypes?: string[];
  includedPrimaryTypes?: string[]; // Optional
  excludedPrimaryTypes?: string[]; // Optional
  maxResultCount?: number;
  locationRestriction: {
    circle: {
      center: {
        latitude: number;
        longitude: number;
      };
      radius: number;
    };
  };
  languageCode?: string; // Optional
  regionCode?: string; // Optional
  rankPreference?: 'DISTANCE' | 'POPULARITY'; // Optional
}
// --- END NEW TYPE DEFINITIONS ---

interface StationOutput {
  id: string | number;
  name: string;
  latitude: number;
  longitude: number;
  source: 'db' | 'google';
  address: string | null;
  google_place_id: string | null;
  brand: GasStationBrand | null; // Updated to use the enum
  website?: string | null; // Added for lookup table result
  fuel_prices?: any | null; // Added for lookup table result (can be more specific later)
}

interface RequestPayload {
  lat: number;
  lng: number;
  radius_km: number;
  type?: string;
}

serve(async (req: Request)=>{
  try {
    // Early exit if critical environment variables are not set
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const googleMapsApiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");

    if (!supabaseUrl) {
      console.error("Missing environment variable: SUPABASE_URL");
      return new Response(JSON.stringify({ error: "Server configuration error: SUPABASE_URL is not set." }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }
    if (!supabaseAnonKey) {
      console.error("Missing environment variable: SUPABASE_ANON_KEY");
      return new Response(JSON.stringify({ error: "Server configuration error: SUPABASE_ANON_KEY is not set." }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }
    if (!googleMapsApiKey) {
      console.error("Missing environment variable: GOOGLE_MAPS_API_KEY");
      return new Response(JSON.stringify({ error: "Server configuration error: GOOGLE_MAPS_API_KEY is not set." }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { lat, lng, radius_km, type }: Omit<Partial<RequestPayload>, 'keyword'> = await req.json();

    if (!lat || !lng || !radius_km) {
      return new Response(JSON.stringify({ error: "Missing required parameters: lat, lng, radius_km" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    const allStations: StationOutput[] = [];
    const processedGooglePlaceIds = new Set<string>(); // Stores google_place_id from DB stations

    // 1. Query local DB first
    try {
      const { data: dbStationsData, error: dbError } = await supabase.rpc("get_stations_within_radius", {
        lat,
        lng,
        radius_km
      });
      if (dbError) {
        console.error("Error fetching stations from DB:", dbError);
      // Depending on desired behavior, you might return an error or continue to Google Places
      } else if (dbStationsData) {
        const formattedDbStations = (dbStationsData as DbStation[]).map((s: DbStation): StationOutput => {
          return {
            id: s.id,
            name: s.name,
            latitude: s.latitude,
            longitude: s.longitude,
            source: 'db' as const,
            address: s.address,
            google_place_id: s.google_place_id,
            brand: GasStationBrand[s.brand as keyof typeof GasStationBrand] || GasStationBrand.Unknown // Convert string from DB to enum
          };
        });

        formattedDbStations.forEach((station: StationOutput)=>{
          allStations.push(station); // Add all DB stations
          if (station.google_place_id) { // If DB station has a google_place_id
            processedGooglePlaceIds.add(station.google_place_id); // Add it to our set
          }
        });
      }
    } catch (e) {
      console.error("Exception fetching from DB:", e);
    }
    // 2. Query Google Places API
    try {
      // Construct the request body for Google Places API
      const requestBody: GoogleApiRequestBody = {
        includedTypes: type ? [type] : undefined, 
        maxResultCount: 20, 
        locationRestriction: {
          circle: {
            center: {
              latitude: lat,
              longitude: lng
            },
            radius: radius_km * 1000 // Radius in meters
          }
        }
      };

      // Define the fields you want Google to return
      const fieldMask = "places.id,places.displayName,places.formattedAddress,places.location,places.types";

      const googleResponse = await fetch(`${PLACES_API_URL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": googleMapsApiKey,
          "X-Goog-FieldMask": fieldMask
        },
        body: JSON.stringify(requestBody)
      });

      if (!googleResponse.ok) {
        const errorBody = await googleResponse.text();
        console.error(`Google Places API error: ${googleResponse.status}`, errorBody);
      // Decide if to throw, return partial, or just log
      } else {
        const googleData = await googleResponse.json() as GooglePlacesApiResponse;
        if (googleData.places) {
          const googleStations = googleData.places
            .map((place: GooglePlaceResultItem): StationOutput | null => { // Allow returning null
              const lat = place.location?.latitude;
              const lng = place.location?.longitude;

              if (typeof lat !== 'number' || typeof lng !== 'number') {
                console.warn(`Google Place item ${place.id} (${place.displayName.text}) is missing valid coordinates. Skipping.`);
                return null; // Skip this item
              }

              // Placeholder for LLM call to determine brand
              // const determinedBrand: GasStationBrand = await callGeminiLLM(place.displayName.text);
              // For now, we'll default to Unknown, you'll replace this
              const determinedBrand: GasStationBrand = GasStationBrand.Unknown;

              // Placeholder for lookup table to get website and fuel prices
              // const brandDetails = await getBrandDetails(determinedBrand);

              return {
                id: place.id,
                name: place.displayName.text,
                latitude: lat,
                longitude: lng,
                address: place.formattedAddress || null,
                google_place_id: place.id,
                source: 'google' as const,
                brand: determinedBrand, // Use the determined brand
                // website: brandDetails?.website, // Populate from lookup
                // fuel_prices: brandDetails?.fuel_prices // Populate from lookup
              };
            })
            .filter((station): station is StationOutput => station !== null); // Type guard to filter out nulls and satisfy TS

          googleStations.forEach((gStation: StationOutput)=>{ // Renamed to gStation for clarity
            // Only add Google station if its google_place_id has not been processed (i.e., not found in DB with that ID)
            // And ensure it actually has a google_place_id to check against the set
            if (gStation.google_place_id && !processedGooglePlaceIds.has(gStation.google_place_id)) {
              allStations.push(gStation);
              // No need to add gStation.google_place_id to processedGooglePlaceIds here again,
              // as Google results are generally unique by place_id for a single query.
              // If merging/enrichment was happening, this might be different.
            } else if (!gStation.google_place_id) {
              // This case should ideally not happen if Google always provides a place_id for valid results
              console.warn("Google Place missing google_place_id after mapping:", gStation.name);
            }
          });
        }
      }
    } catch (e) {
      console.error("Exception fetching from Google Places:", e);
    }
    return new Response(JSON.stringify(allStations), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      status: 200
    });
  } catch (error) {
    console.error("Unhandled error in Edge Function:", error);
    let errorMessage = "An unexpected error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return new Response(JSON.stringify({
      error: errorMessage
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
});
