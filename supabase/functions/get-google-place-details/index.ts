import { corsHeaders } from '../_shared/cors.ts'; // Assuming a shared CORS setup

const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
const PLACES_DETAILS_URL = "https://places.googleapis.com/v1/places/";

// Define a comprehensive field mask. Adjust based on actual needs & SKU costs.
const FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'addressComponents',
  'location', // { latitude, longitude }
  'viewport',
  'businessStatus',
  'types',
  'primaryType',
  'primaryTypeDisplayName',
  'googleMapsUri',
  'websiteUri',
  'regularOpeningHours', // Includes periods, weekdayText, openNow (if requested in currentOpeningHours)
  'currentOpeningHours', // For openNow status and secondary hours
  'utcOffsetMinutes',
  'internationalPhoneNumber',
  'nationalPhoneNumber',
  'rating',
  'userRatingCount',
  'iconMaskBaseUri',
  'iconBackgroundColor',
].join(',');

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!GOOGLE_MAPS_API_KEY) {
    console.error("Google Maps API Key is not set in environment variables.");
    return new Response(JSON.stringify({ error: "Server configuration error: Missing API Key." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const placeId = url.searchParams.get("place_id");
    const languageCode = url.searchParams.get("language_code") || 'en'; // Optional language
    const regionCode = url.searchParams.get("region_code"); // Corrected: was url.search_params

    if (!placeId) {
      return new Response(JSON.stringify({ error: "Missing place_id parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requestUrl = `${PLACES_DETAILS_URL}${placeId}`;
    const headers = {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
      "X-Goog-FieldMask": FIELD_MASK,
    };

    // Construct query parameters for language and region if provided
    const queryParams = new URLSearchParams();
    queryParams.append('languageCode', languageCode);
    if (regionCode) {
      queryParams.append('regionCode', regionCode);
    }
    const queryString = queryParams.toString();
    const fullRequestUrl = queryString ? `${requestUrl}?${queryString}` : requestUrl;
    
    const response = await fetch(fullRequestUrl, { method: "GET", headers });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => response.text());
      console.error(`Google Places API error: ${response.status}`, errorBody);
      return new Response(JSON.stringify({ 
        error: "Failed to fetch place details from Google", 
        status: response.status,
        googleError: errorBody 
      }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in get-google-place-details function:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/*
Test with curl (ensure Supabase is running locally or function is deployed,
and GOOGLE_MAPS_API_KEY is set in function's environment variables):

curl -i -X GET \
  "http://localhost:54321/functions/v1/get-google-place-details?place_id=YOUR_GOOGLE_PLACE_ID" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY_OR_USER_JWT" 

(Replace YOUR_GOOGLE_PLACE_ID and YOUR_SUPABASE_ANON_KEY_OR_USER_JWT)
*/ 