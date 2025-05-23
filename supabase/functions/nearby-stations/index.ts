import { serve } from "https://deno.land/std@0.175.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
const PLACES_API_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";

interface Station {
  id: string | number;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  // Add other relevant station properties from your 'stations' table
  source?: 'db' | 'google'; // To differentiate origin
  google_place_id?: string;
}

interface GooglePlaceResult {
  place_id: string;
  name: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  vicinity?: string; // Address or description, often optional
  // Potentially map other fields like opening_hours, rating etc.
}

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: "Supabase URL or Anon Key not provided." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!GOOGLE_MAPS_API_KEY) {
      console.error("Google Maps API Key not provided.");
      return new Response(JSON.stringify({ error: "Google Maps API Key not provided." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { lat, lng, radius_km, keyword, type } = await req.json();

    if (!lat || !lng || !radius_km) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: lat, lng, radius_km" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const allStations: Station[] = [];
    const uniqueStationIdentifiers = new Set<string>(); // Using google_place_id or db id

    // 1. Query local DB first
    try {
      const { data: dbStations, error: dbError } = await supabase.rpc(
        "get_stations_within_radius",
        { lat, lng, radius_km }
      );

      if (dbError) {
        console.error("Error fetching stations from DB:", dbError);
        // Depending on desired behavior, you might return an error or continue to Google Places
      } else if (dbStations) {
        const formattedDbStations: Station[] = dbStations.map((s: Omit<Station, 'source'>) => ({
          ...s, // Spread all properties from your db station model
          id: s.id, // Ensure id is mapped correctly
          name: s.name,
          latitude: s.latitude,
          longitude: s.longitude,
          source: 'db' as const,
        }));
        formattedDbStations.forEach(station => {
          if (!uniqueStationIdentifiers.has(String(station.id))) {
            allStations.push(station);
            uniqueStationIdentifiers.add(String(station.id));
          }
        });
      }
    } catch (e) {
      console.error("Exception fetching from DB:", e);
    }

    // 2. Query Google Places API
    try {
      const params = new URLSearchParams({
        location: `${lat},${lng}`,
        radius: (radius_km * 1000).toString(), // Google Places API expects radius in meters
        key: GOOGLE_MAPS_API_KEY,
      });
      if (keyword) params.append("keyword", keyword as string);
      if (type) params.append("type", type as string); // e.g., 'gas_station'

      const googleResponse = await fetch(`${PLACES_API_URL}?${params.toString()}`);
      if (!googleResponse.ok) {
        const errorBody = await googleResponse.text();
        console.error(`Google Places API error: ${googleResponse.status}`, errorBody);
        // Decide if to throw, return partial, or just log
      } else {
        const googleData = await googleResponse.json();
        if (googleData.results) {
          const googleStations: Station[] = googleData.results.map((place: GooglePlaceResult) => ({
            id: place.place_id, // Use place_id as a unique identifier from Google
            name: place.name,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            address: place.vicinity,
            google_place_id: place.place_id,
            source: 'google' as const,
            // Potentially map other fields like opening_hours, rating etc.
          }));

          googleStations.forEach(station => {
            // Prefer DB entries if a similar one (e.g., by name and location proximity) exists
            // For simplicity here, we'll use google_place_id to check uniqueness among Google results
            // and assume DB entries are identified by their own IDs.
            // A more robust de-duplication would involve comparing names and locations.
            if (station.google_place_id && !uniqueStationIdentifiers.has(station.google_place_id)) {
              allStations.push(station);
              uniqueStationIdentifiers.add(station.google_place_id);
            } else if (!station.google_place_id) { // Should not happen if it's a Google result
              console.warn("Google Place missing place_id:", station.name);
            }
          });
        }
      }
    } catch (e) {
      console.error("Exception fetching from Google Places:", e);
    }
    
    // 3. TODO: Merge and de-duplicate results more robustly if needed
    // For now, we added DB results first, then unique Google results.
    // A more advanced de-duplication could involve:
    //  - Comparing names and locations (e.g., using Haversine distance)
    //  - Preferring data from one source over another or merging fields.

    return new Response(JSON.stringify(allStations), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, // Adjust CORS as needed
      status: 200,
    });

  } catch (error) {
    console.error("Unhandled error in Edge Function:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/* 
Test with curl (ensure Supabase is running locally or function is deployed):

curl -i -X POST http://localhost:54321/functions/v1/nearby-stations \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 6.5244, 
    "lng": 3.3792, 
    "radius_km": 5,
    "type": "gas_station"
  }'

Make sure to replace YOUR_SUPABASE_ANON_KEY with your actual Supabase anon key.
If testing deployed function, replace localhost:54321 with your Supabase project URL.
Set GOOGLE_MAPS_API_KEY in your Supabase project's Edge Function environment variables.
*/ 