import { STATUS_CODE } from "jsr:@std/http/status";
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js";
import { GoogleGenAI } from "https://esm.sh/@google/genai";
import { corsHeaders } from "../_shared/cors.ts";
import { GasStationBrand } from "../../../shared/enums.ts";
import { FuelPrices } from "../_shared/types.ts";

const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
let genAI: GoogleGenAI | undefined;

if (geminiApiKey) {
  genAI = new GoogleGenAI({ apiKey: geminiApiKey });
} else {
  console.warn("GEMINI_API_KEY environment variable is not set. Fuel price fetching and Gemini operations will be skipped.");
}

// Initialize Supabase client
let supabaseAdmin: SupabaseClient | undefined;
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (supabaseUrl && supabaseServiceRoleKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });
} else {
  console.warn("Supabase URL or Service Role Key not set. Database operations will be skipped.");
}

// Interface for data to be upserted to brand_info table
interface BrandInfoUpsert {
  brand_key: string;
  petrol_price?: number | null;
  diesel_price?: number | null;
  kerosene_price?: number | null;
  gas_price?: number | null;
  prices_last_updated_at?: string; // ISO string
  website?: string | null;
}

// JSON Schema for the expected FuelPrices output from Gemini
const fuelPricesSchema = {
  type: "OBJECT",
  properties: {
    petrol: { 
      type: "NUMBER", 
      description: "Price of petrol (PMS) in NGN. Null or omit if not available." 
    },
    diesel: { 
      type: "NUMBER", 
      description: "Price of diesel (AGO) in NGN. Null or omit if not available." 
    },
    kerosene: { 
      type: "NUMBER", 
      description: "Price of kerosene in NGN. Null or omit if not available." 
    },
    gas: { 
      type: "NUMBER", 
      description: "Price of LPG/gas in NGN. Null or omit if not available." 
    }
  },
  description: "An object containing fuel prices. Fields can be null or omitted if a price is not found."
};

async function getFuelPricesFromGemini(brandNameOrQuery: string): Promise<FuelPrices | null> {
  if (!geminiApiKey || !genAI) {
    console.error("Gemini API key or client not initialized. Cannot fetch live fuel prices.");
    return null;
  }

  const currentMonthYear = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date());
  const retrievalPrompt = `Using Google Search, find the current average fuel prices (PMS/petrol, AGO/diesel, DPK/kerosene, LPG/gas) for ${brandNameOrQuery} in Nigeria as of ${currentMonthYear}. If searching for general average prices, use "Nigeria average" or similar as the query. Provide a detailed text response with the prices found.`;

  console.log(`Step 1: Fetching raw price data for ${brandNameOrQuery} using Google Search grounding...`);

  try {
    const retrievalResult = await genAI.models.generateContent({
      model: "gemini-2.5-flash-preview-05-20", 
      contents: [{ role: "user", parts: [{ text: retrievalPrompt }] }],
      config: {
        tools: [{ googleSearch: {} }] 
      }
    });

    const retrievedText = retrievalResult.text ? retrievalResult.text.trim() : "";
    console.log(`Step 1: Raw text response for ${brandNameOrQuery}: `, retrievedText);

    if (!retrievedText) {
      console.warn(`Step 1: No text content retrieved from Gemini for ${brandNameOrQuery}`);
      return null;
    }

    console.log(`Step 2: Formatting retrieved text into JSON for ${brandNameOrQuery}...`);
    const formattingPrompt = `Given the following text, extract the fuel prices (petrol, diesel, kerosene, gas) and format them into a JSON object with keys: petrol, diesel, kerosene, gas. All prices in NGN. If a price is unavailable, its value should be null or the key omitted. Only output the JSON object. Text: ${retrievedText}`;
    
    const formattingResult = await genAI.models.generateContent({
        model: "gemini-2.5-flash-preview-05-20",
        contents: [{role: "user", parts: [{text: formattingPrompt}]}],
        config: {
            responseMimeType: "application/json",
            responseSchema: fuelPricesSchema,
        }
    });

    let jsonStringResponse = formattingResult.text ? formattingResult.text.trim() : "";
    console.log(`Step 2: Raw JSON string response for ${brandNameOrQuery}: `, jsonStringResponse.substring(0, 500) + (jsonStringResponse.length > 500 ? '...' : ''));

    if (!jsonStringResponse) {
      console.warn(`Step 2: No JSON content in formatting response for ${brandNameOrQuery}`);
      return null;
    }

    // Clean up malformed decimal numbers with excessive zeros
    const cleanJsonString = (jsonStr: string): string => {
      // Check if the JSON string is suspiciously long (> 10KB indicates potential issue)
      if (jsonStr.length > 1000) {
        console.warn(`Step 2: Detected suspiciously long JSON response (${jsonStr.length} chars) for ${brandNameOrQuery}, attempting cleanup...`);
        
        // Replace numbers with excessive decimal places with reasonable precision
        // Match pattern: number followed by many zeros after decimal point
        const cleanedStr = jsonStr.replace(
          /(\d+)\.0{50,}/g, // Match numbers with 50+ consecutive zeros after decimal
          '$1' // Replace with just the integer part
        ).replace(
          /(\d+\.\d{1,2})0{20,}/g, // Match numbers with reasonable decimals followed by many zeros
          '$1' // Keep only the first 1-2 decimal places
        );
        
        console.log(`Step 2: Cleaned JSON length reduced from ${jsonStr.length} to ${cleanedStr.length} chars for ${brandNameOrQuery}`);
        return cleanedStr;
      }
      return jsonStr;
    };

    // Apply cleanup
    jsonStringResponse = cleanJsonString(jsonStringResponse);

    try {
      const parsedPrices: FuelPrices = JSON.parse(jsonStringResponse);
      
      // Validate and sanitize the parsed prices
      const sanitizedPrices: FuelPrices = {};
      for (const [key, value] of Object.entries(parsedPrices)) {
        if (typeof value === 'number' && !isNaN(value) && isFinite(value) && value > 0) {
          // Round to 2 decimal places to avoid precision issues
          sanitizedPrices[key as keyof FuelPrices] = Math.round(value * 100) / 100;
        } else if (value === null || value === undefined) {
          sanitizedPrices[key as keyof FuelPrices] = null;
        }
        // Skip invalid values (negative numbers, non-finite numbers, etc.)
      }
      
      const hasPrices = Object.values(sanitizedPrices).some(price => typeof price === 'number' && price !== null);
      console.log(`Step 2: Parsed and sanitized prices for ${brandNameOrQuery}:`, sanitizedPrices);
      return hasPrices ? sanitizedPrices : null;
    } catch (parseError) {
      console.error(`Step 2: Error parsing JSON response from Gemini SDK for ${brandNameOrQuery}:`, parseError);
      console.error(`Step 2: Problematic JSON string length: ${jsonStringResponse.length}, first 1000 chars: "${jsonStringResponse.substring(0, 1000)}"`);
      return null;
    }

  } catch (error) {
    console.error(`Error in getFuelPricesFromGemini for ${brandNameOrQuery}: `, (error as Error).message, error);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!supabaseAdmin) {
    console.error("Supabase admin client not initialized. Cannot update database.");
    return new Response(JSON.stringify({ error: "Supabase client not initialized" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: STATUS_CODE.InternalServerError,
    });
  }

  try {
    console.log("Fetching general average fuel prices for Nigeria...");
    const averagePrices = await getFuelPricesFromGemini("Nigeria general average");
    if (averagePrices) {
      console.log("Successfully fetched general average prices:", averagePrices);
    } else {
      console.warn("Could not fetch general average fuel prices. Fallbacks might not be available for some brands/fuels.");
    }

    const brandsToUpdate = (Object.keys(GasStationBrand) as Array<keyof typeof GasStationBrand>)
      .filter(key => isNaN(Number(key)));

    let updateCount = 0;
    let errorCount = 0;
    const BATCH_SIZE = 3; // Process 3 brands concurrently at a time

    for (let i = 0; i < brandsToUpdate.length; i += BATCH_SIZE) {
      const batch = brandsToUpdate.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch: ${batch.join(', ')} (Batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(brandsToUpdate.length / BATCH_SIZE)})`);

      const batchPromises = batch.map(async (brandKey) => {
        let pricesToUpsert: FuelPrices | null = null;
        let sourceForLog = "specific"; // For logging purposes

        if (brandKey === GasStationBrand.Other || brandKey === GasStationBrand.Unknown) {
          console.log(`Using general average prices for ${brandKey}.`);
          pricesToUpsert = averagePrices;
          sourceForLog = "average";
        } else {
          const specificBrandPrices = await getFuelPricesFromGemini(brandKey);
          if (specificBrandPrices) {
            console.log(`Successfully fetched prices for ${brandKey}:`, specificBrandPrices);
            pricesToUpsert = {
              petrol: specificBrandPrices.petrol ?? averagePrices?.petrol ?? null,
              diesel: specificBrandPrices.diesel ?? averagePrices?.diesel ?? null,
              kerosene: specificBrandPrices.kerosene ?? averagePrices?.kerosene ?? null,
              gas: specificBrandPrices.gas ?? averagePrices?.gas ?? null,
            };
          } else {
            console.warn(`No specific prices fetched for ${brandKey}. Falling back to general average prices.`);
            pricesToUpsert = averagePrices;
            sourceForLog = "average-fallback";
          }
        }
        return { brandKey, pricesToUpsert, sourceForLog };
      });

      const settledResults = await Promise.allSettled(batchPromises);

      for (const result of settledResults) {
        if (result.status === 'fulfilled') {
          const { brandKey, pricesToUpsert, sourceForLog } = result.value;

          if (pricesToUpsert && 
              (typeof pricesToUpsert.petrol === 'number' || 
               typeof pricesToUpsert.diesel === 'number' || 
               typeof pricesToUpsert.kerosene === 'number' || 
               typeof pricesToUpsert.gas === 'number')) {
        const upsertData: BrandInfoUpsert = {
          brand_key: brandKey,
              petrol_price: pricesToUpsert.petrol ?? null,
              diesel_price: pricesToUpsert.diesel ?? null,
              kerosene_price: pricesToUpsert.kerosene ?? null,
              gas_price: pricesToUpsert.gas ?? null,
          prices_last_updated_at: new Date().toISOString(),
        };

            try {
              const { error: upsertError } = await supabaseAdmin
          .from("brand_info")
          .upsert(upsertData, { onConflict: "brand_key" });

              if (upsertError) {
                console.error(`Error upserting prices for ${brandKey} (source: ${sourceForLog}):`, upsertError);
                errorCount++;
              } else {
                console.log(`Successfully upserted prices for ${brandKey} (source: ${sourceForLog})`);
                updateCount++;
              }
            } catch (catchError) {
              console.error(`Caught exception during Supabase upsert for ${brandKey} (source: ${sourceForLog}):`, catchError);
          errorCount++;
            }
          } else {
            console.warn(`No prices (specific or average) available for ${brandKey} (source: ${sourceForLog}), skipping database update.`);
          }
        } else {
          console.error("A price processing promise was rejected:", result.reason);
          errorCount++;
        }
      }
    }

    const message = `Fuel price update process completed. ${updateCount} brands updated, ${errorCount} errors.`;
    console.log(message);

    return new Response(
      JSON.stringify({ message, updateCount, errorCount }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: STATUS_CODE.OK, // Return 200 even if there are individual errors, as the function itself completed
      }
    );

  } catch (error) {
    // This catches errors from fetching averagePrices or other synchronous errors before the loop
    const errorMessage = (error as Error).message;
    console.error("Critical error in update-fuel-prices function: ", errorMessage, error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: STATUS_CODE.InternalServerError,
    });
  }
}); 