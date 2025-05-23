import { serve } from "https://deno.land/std@0.175.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); // Use service role key for direct DB write access

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Supabase URL or Service Role Key not provided.");
  // Optional: throw an error to prevent the function from starting if keys are missing at deployment
  // throw new Error("Supabase environment variables are not set.");
}

const supabaseAdmin = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

interface RequestPayload {
  google_place_id: string;
}

serve(async (req: Request) => {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: "Supabase client not initialized. Check server logs." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Check for POST method
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await req.json() as RequestPayload;
    const { google_place_id } = payload;

    if (!google_place_id) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: google_place_id" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // This function should be invoked with user authentication context.
    // However, Supabase client initialized with service_role can bypass RLS.
    // For robust security, ensure this function is called by an authenticated user
    // and potentially pass user_id for audit trails if needed.
    // The JWT verification is implicitly handled by Supabase Edge Functions if `verifyJWT` is true (default).

    // 1. Check if a station with this google_place_id already exists
    const { data: existingStation, error: selectError } = await supabaseAdmin
      .from('stations')
      .select('id')
      .eq('google_place_id', google_place_id)
      .limit(1)
      .single(); // .single() will return null if not found, or error if multiple (which unique constraint should prevent)

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116: Row to return was not found
      console.error("Error selecting station by google_place_id:", selectError);
      return new Response(JSON.stringify({ error: selectError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (existingStation) {
      return new Response(JSON.stringify({ station_id: existingStation.id, message: "Station already exists." }), {
        headers: { "Content-Type": "application/json" },
        status: 200, // Or 200 if that makes more sense for "found existing"
      });
    }

    // 2. If no row exists, insert a new one
    const { data: newStation, error: insertError } = await supabaseAdmin
      .from('stations')
      .insert({
        google_place_id: google_place_id,
        source_type: 'google_places_reference',
        // All other station-specific fields (name, address, lat, lng, etc.) will be NULL or their DB defaults
      })
      .select('id')
      .single(); // Expecting a single row to be inserted and returned

    if (insertError) {
      console.error("Error inserting new station reference:", insertError);
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!newStation) {
      console.error("Failed to insert new station reference, no data returned.");
      return new Response(JSON.stringify({ error: "Failed to create station reference." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ station_id: newStation.id, message: "Station reference created." }), {
      headers: { "Content-Type": "application/json" },
      status: 201, // 201 Created
    });

  } catch (error) {
    console.error("Unhandled error in ensure_station_reference function:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/*
Test with curl (ensure Supabase is running locally or function is deployed):

curl -i -X POST http://localhost:54321/functions/v1/ensure-station-reference \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY_OR_USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "google_place_id": "SOME_GOOGLE_PLACE_ID"
  }'

Replace YOUR_SUPABASE_ANON_KEY_OR_USER_JWT with a valid JWT if verifyJWT is true.
If using service_role key for testing directly (as in this function with supabaseAdmin), 
  ensure RLS is considered or function is only callable by trusted clients/services.
For production, ensure `verifyJWT` is true for the function and it's called with a user's JWT.
*/ 