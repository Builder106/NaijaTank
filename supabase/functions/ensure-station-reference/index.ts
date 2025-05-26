// TODO: Use latest JSR packages
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
serve(async (req: Request)=>{
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({
      error: "Supabase client not initialized. Check server logs."
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  // Check for POST method
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: "Method Not Allowed"
    }), {
      status: 405,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  try {
    const payload = await req.json();
    const { google_place_id } = payload;
    if (!google_place_id) {
      return new Response(JSON.stringify({
        error: "Missing required parameter: google_place_id"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
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
      .single(); // .limit(1) is redundant when .single() is used

    if (selectError) {
      // This condition catches any database error during the select operation.
      // If .single() errors due to multiple rows found (e.g., PGRST116),
      // it implies an issue, such as a missing or ineffective unique constraint.
      console.error("Error checking for existing station by google_place_id:", selectError);
      return new Response(JSON.stringify({
        error: `Error looking up station: ${selectError.message}` // Provide a more context-specific message
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (existingStation) {
      // If existingStation is not null, a station was found (and selectError was null).
      return new Response(JSON.stringify({
        station_id: existingStation.id,
        message: "Station already exists."
      }), {
        headers: { "Content-Type": "application/json" },
        status: 200 // HTTP 200 OK for existing resource
      });
    }

    // If selectError was null and existingStation was null, no station was found.
    // Proceed to insert a new station reference.
    // 2. If no row exists, insert a new one
    const { data: newStation, error: insertError } = await supabaseAdmin.from('stations').insert({
      google_place_id: google_place_id,
      source_type: 'google_places_reference'
    }).select('id').single(); // Expecting a single row to be inserted and returned
    if (insertError) {
      console.error("Error inserting new station reference:", insertError);
      return new Response(JSON.stringify({
        error: insertError.message
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    if (!newStation) {
      console.error("Failed to insert new station reference, no data returned.");
      return new Response(JSON.stringify({
        error: "Failed to create station reference."
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    return new Response(JSON.stringify({
      station_id: newStation.id,
      message: "Station reference created."
    }), {
      headers: {
        "Content-Type": "application/json"
      },
      status: 201
    });
  } catch (error) {
    console.error("Unhandled error in ensure_station_reference function:", error);
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
