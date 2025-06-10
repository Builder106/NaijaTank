import { createClient } from "jsr:@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";

const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Ensure Supabase client is configured
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }

  const supabaseAdminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Check for Authorization header (user authentication)
  // Note: Actual JWT validation against Supabase Auth would be more robust
  // For simplicity here, we're just checking if the header exists.
  // In a production scenario, you would typically use the user's JWT to get their ID
  // and ensure they are authorized for this action if needed.
  // However, this function's primary role is to ensure a station reference,
  // which might be triggered by various authenticated user actions.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  try {
    const { google_place_id } = await req.json();

    if (!google_place_id) {
      return new Response(
        JSON.stringify({ error: "google_place_id is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Check if station with this google_place_id already exists
    const { data: existingStation, error: selectError } = await supabaseAdminClient
      .from("stations")
      .select("id")
      .eq("google_place_id", google_place_id)
      .maybeSingle();

    if (selectError) {
      console.error("Error checking for existing station:", selectError);
      return new Response(
        JSON.stringify({ error: "Database error: " + selectError.message }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    if (existingStation) {
      return new Response(
        JSON.stringify({ station_id: existingStation.id }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // If not found, insert a new station reference
    // We only insert minimal data here. Other details can be fetched on demand.
    const { data: newStation, error: insertError } = await supabaseAdminClient
      .from("stations")
      .insert({
        google_place_id: google_place_id,
        source_type: "google_places_reference", // Mark the source
        // Other fields like name, address, lat, lng can be nullable
        // or fetched and populated by another process if needed immediately
      })
      .select("id")
      .single(); // We expect a single row to be inserted and returned

    if (insertError) {
      console.error("Error inserting new station:", insertError);
      // Handle potential unique constraint violation if, by chance, another request created it
      if (insertError.code === "23505") { // Unique violation
         // Try fetching again, as it might have been created concurrently
        const { data: concurrentStation, error: concurrentSelectError } = await supabaseAdminClient
          .from("stations")
          .select("id")
          .eq("google_place_id", google_place_id)
          .single();

        if (concurrentSelectError || !concurrentStation) {
            console.error("Error after presumed concurrent insert:", concurrentSelectError);
            return new Response(
              JSON.stringify({ error: "Database error after concurrent check: " + (concurrentSelectError?.message || "Station not found") }),
              {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
              }
            );
        }
        return new Response(
            JSON.stringify({ station_id: concurrentStation.id }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200, // Or 201 if we want to signify it was just "created" by this logical flow
            }
          );
      }
      return new Response(
        JSON.stringify({ error: "Database error: " + insertError.message }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    if (!newStation) {
        console.error("New station data is null after insert, this should not happen.");
        return new Response(
          JSON.stringify({ error: "Failed to create or retrieve station reference after insert." }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
    }

    return new Response(JSON.stringify({ station_id: newStation.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 201, // 201 Created
    });

  } catch (error) {
    console.error("Error processing request:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400, // Bad Request if JSON parsing fails or other client error
    });
  }
}); 