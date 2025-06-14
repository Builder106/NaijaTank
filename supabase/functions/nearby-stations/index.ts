// TODO: Use latest JSR packages
import { createClient } from "jsr:@supabase/supabase-js";
import { GoogleGenAI, Schema } from 'https://esm.sh/@google/genai@1.4.0';
import { GasStationBrand, FuelPrices } from "../_shared/types.ts";
import { getBrandDetails, EnrichedBrandDetails } from "../_shared/brand-details.ts";
import { corsHeaders } from "../_shared/cors.ts"; // Import shared CORS headers

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
  fuel_prices?: FuelPrices | null; // Replaced any with FuelPrices
  logoUrl?: string | null; // For Brandfetch URL
}

interface RequestPayload {
  lat: number;
  lng: number;
  radius_km: number;
  type?: string;
}
// --- END NEW TYPE DEFINITIONS ---

// --- START HELPER FUNCTION FOR BATCH LLM with Structured Output ---
async function determineBrandsForMultipleStations(
  stationNames: string[],
  apiKey: string | undefined
): Promise<Record<string, GasStationBrand>> {
  const results: Record<string, GasStationBrand> = {};
  stationNames.forEach(name => results[name] = GasStationBrand.Unknown);

  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. Cannot determine brands. All falling back to Unknown.");
    return results;
  }
  if (stationNames.length === 0) {
    return results;
  }

  try {
    const genAI = new GoogleGenAI({apiKey:apiKey});

    const stationBrandPropertySchema = {
      type: "STRING", // Use string literal
      enum: Object.values(GasStationBrand), 
    };

    const dynamicProperties: Record<string, typeof stationBrandPropertySchema> = {};
    stationNames.forEach(name => {
      dynamicProperties[name] = stationBrandPropertySchema;
    });

    const responseSchema = {
      type: "OBJECT", // Use string literal
      properties: dynamicProperties,
      required: stationNames, 
    };

    const stationNamesListForPrompt = stationNames.map(name => `\"${name}\"`).join(", ");
    const brandEnumValuesForPrompt = Object.values(GasStationBrand).join(", ");

    const prompt = 
      `For each gas station name in the list [${stationNamesListForPrompt}], determine its brand. ` +
      `The possible brands are: ${brandEnumValuesForPrompt}. ` +
      `If a name clearly matches one of these brands, use that brand. ` +
      `If a name appears to be a gas station but doesn't match a specific brand from the list, use "${GasStationBrand.Other}". ` +
      `If a name is too generic (e.g., "Service Station") or clearly not a gas station, use "${GasStationBrand.Unknown}". ` +
      `Your response must be a JSON object structured according to the provided schema.`;

    const generationResult = await genAI.models.generateContent({
        model: "gemini-2.5-flash-preview-05-20",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema as Schema,
        }
    });

    const responseText = generationResult.text ? generationResult.text.trim() : "";

    let llmResults: Record<string, string>;
    try {
      llmResults = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Error parsing LLM JSON response:", parseError, "\nResponse was:", responseText);
      return results; 
    }

    for (const name of stationNames) {
      const llmBrandString = llmResults[name];
      if (llmBrandString) {
        const determinedBrand = Object.values(GasStationBrand).find(
          brand => brand.toLowerCase() === llmBrandString.toLowerCase()
        );
        if (determinedBrand) {
          results[name] = determinedBrand;
        } else {
          console.warn(`LLM (schema) returned a brand "${llmBrandString}" not in GasStationBrand enum for station: "${name}". Defaulting to Other.`);
          results[name] = GasStationBrand.Other;
        }
      } else {
        console.warn(`LLM (schema) response did not contain an entry for station: "${name}". Keeping Unknown.`);
      }
    }
    return results;

  } catch (error) {
    console.error("Error calling Gemini API for batch brand determination (schema):", error);
    return results;
  }
}
// --- END HELPER FUNCTION FOR BATCH LLM ---

Deno.serve(async (req: Request) => {
  // Handle OPTIONS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Early exit if critical environment variables are not set
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const googleMapsApiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!supabaseUrl) {
      console.error("Missing environment variable: SUPABASE_URL");
      return new Response(JSON.stringify({ error: "Server configuration error: SUPABASE_URL is not set." }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!supabaseAnonKey) {
      console.error("Missing environment variable: SUPABASE_ANON_KEY");
      return new Response(JSON.stringify({ error: "Server configuration error: SUPABASE_ANON_KEY is not set." }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!googleMapsApiKey) {
      console.error("Missing environment variable: GOOGLE_MAPS_API_KEY");
      return new Response(JSON.stringify({ error: "Server configuration error: GOOGLE_MAPS_API_KEY is not set." }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!geminiApiKey) {
      console.warn("Warning: GEMINI_API_KEY environment variable is not set. Brand determination via LLM will be limited.");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { lat, lng, radius_km, type }: Partial<RequestPayload> = await req.json();

    if (!lat || !lng || !radius_km) {
      return new Response(JSON.stringify({ error: "Missing required parameters: lat, lng, radius_km" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
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
          const brandEnum = GasStationBrand[s.brand as keyof typeof GasStationBrand] || GasStationBrand.Unknown;
          const brandInfo: EnrichedBrandDetails | undefined = getBrandDetails(brandEnum);
          return {
            id: s.id,
            name: s.name,
            latitude: s.latitude,
            longitude: s.longitude,
            source: 'db' as const,
            address: s.address,
            google_place_id: s.google_place_id,
            brand: brandEnum,
            website: brandInfo?.website ?? null,
            fuel_prices: brandInfo?.defaultFuelPrices ?? null,
            logoUrl: brandInfo?.brandfetchLogoUrl ?? null,
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
    let googlePlaceItemsToProcess: GooglePlaceResultItem[] = [];
    try {
      // Construct the request body for Google Places API
      const requestBody: GoogleApiRequestBody = {
        includedTypes: type ? [type] : ["gas_station"], // Default to gas_station if no type
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
          googlePlaceItemsToProcess = googleData.places.filter(place => {
            const placeLat = place.location?.latitude;
            const placeLng = place.location?.longitude;
            if (typeof placeLat !== 'number' || typeof placeLng !== 'number') {
              console.warn(`Google Place item ${place.id} (${place.displayName.text}) is missing valid coordinates. Skipping initial filter.`);
              return false;
            }
            if (place.id && processedGooglePlaceIds.has(place.id)) {
              return false; // Skip if already processed from DB
            }
            return true;
          });
        }
      }
    } catch (e) {
      console.error("Exception fetching from Google Places:", e);
    }

    // 3. Determine brands for new Google Places items using batch LLM call
    const stationNamesToQuery = googlePlaceItemsToProcess.map(p => p.displayName.text);
    let brandResults: Record<string, GasStationBrand> = {};

    if (stationNamesToQuery.length > 0) {
      brandResults = await determineBrandsForMultipleStations(stationNamesToQuery, geminiApiKey);
    }

    // 4. Add Google Place items to allStations with determined brands
    for (const place of googlePlaceItemsToProcess) {
      const determinedBrand = brandResults[place.displayName.text] || GasStationBrand.Unknown;
      const brandInfo: EnrichedBrandDetails | undefined = getBrandDetails(determinedBrand);
      allStations.push({
        id: place.id,
        name: place.displayName.text,
        latitude: place.location!.latitude, // Already checked in filter
        longitude: place.location!.longitude, // Already checked in filter
        address: place.formattedAddress ?? null,
        google_place_id: place.id,
        source: 'google' as const,
        brand: determinedBrand,
        website: brandInfo?.website ?? null,
        fuel_prices: brandInfo?.defaultFuelPrices ?? null,
        logoUrl: brandInfo?.brandfetchLogoUrl ?? null,
      });
    }

    return new Response(JSON.stringify(allStations), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
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
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
});
