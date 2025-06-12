import { Injectable } from '@angular/core';
import { Observable, throwError, from } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Station, FuelStatus } from '../models/station.model';
import { SupabaseService } from './supabase.service';

// Define the expected structure from the nearby-stations Edge Function
interface EdgeStation extends Station { // Or a more specific interface if Edge returns slightly different structure initially
  source: 'db' | 'google';
  google_place_id?: string;
  // Ensure all fields from your Station model that the Edge Function might return are here
  // If the edge function doesn't return all fields (e.g. distance, reliabilityScore), they'll be null/undefined or set later
}

@Injectable({
  providedIn: 'root'
})
export class StationService {
  constructor(
    private supabaseService: SupabaseService
  ) {}

  /**
   * Fetches stations from the 'nearby-stations' Edge Function.
   * This function now expects geographic coordinates and a radius.
   * @param latitude User's current latitude.
   * @param longitude User's current longitude.
   * @param radiusKm Search radius in kilometers.
   * @param fuelTypes Optional: Filters for specific fuel types (might translate to 'keyword' or 'type' for the Edge Function).
   * @param keyword Optional: A keyword to search for (e.g., a station brand).
   */
  getStations(
    latitude: number,
    longitude: number,
    radiusKm: number,
    fuelTypes?: string[], // This might be used to form a 'keyword' or 'type' parameter
    keyword?: string
  ): Observable<Station[]> { // Should return Station[] which includes the source property
    
    const params: any = {
      lat: latitude,
      lng: longitude,
      radius_km: radiusKm
    };

    // Example: construct a keyword from fuelTypes or use the direct keyword
    // This logic depends on how you want to use fuelTypes with the Google Places API via the Edge Function
    if (keyword) {
      params.keyword = keyword;
    } else if (fuelTypes && fuelTypes.length > 0) {
      // For simplicity, let's assume 'gas_station' type if fuelTypes are mentioned, 
      // or you could concatenate fuelTypes into a keyword string.
      // The 'nearby-stations' Edge Function should be designed to handle this.
      params.type = 'gas_station'; // Or params.keyword = fuelTypes.join(' ');
    }

    return from(
      this.supabaseService.supabase.functions.invoke('nearby-stations', {
        body: params,
      })
    ).pipe(
      map((response: any) => {
        if (response.error) {
          console.error('Error calling nearby-stations Edge Function:', response.error);
          throw new Error(response.error.message || 'Failed to invoke nearby-stations');
        }
        // The Edge Function returns an array of stations directly in response.data
        // Ensure the mapping matches the structure returned by your Edge Function and your frontend Station model
        return (response.data || []).map((item: any) => ({
          id: item.id, // This ID will be Google Place ID for source:google, or DB ID for source:db
          name: item.name,
          brand: item.brand, // Might be null for Google results initially
          address: item.address || item.vicinity, // Google uses 'vicinity' or formatted_address
          latitude: item.latitude,
          longitude: item.longitude,
          distance: item.distance, // Assuming Edge function might calculate or frontend will do it
          reliabilityScore: item.reliabilityScore, // Assuming Edge function might provide or frontend will do it
          operatingHours: item.operatingHours || null, // Updated to null for consistency with Station model
          fuelStatus: item.fuelStatus || null, // Updated to null
          contact: {
            phone: item.contact?.phone || null,
            website: item.contact?.website || item.website || null // Prioritize contact.website, then item.website from Google
          },
          lastReported: item.lastReported || null, // Updated to null
          reportCount: item.reportCount || null,
          source: item.source, // 'db' or 'google'
          google_place_id: item.google_place_id || (item.source === 'google' ? item.id : null),
          logoUrl: item.logoUrl || null, // From nearby-stations if available (brand-details derived)
          website: item.website || null, // From nearby-stations (brand-details derived or Google direct)
          rawFuelPrices: item.fuel_prices || null, // From nearby-stations (brand-details derived)
          // types will be populated by getGooglePlaceDetails for Google source, or part of DB record
          // detailsFetched is a frontend state, not from backend directly
        } as Station));
      }),
      catchError(error => {
        console.error('Error in getStations calling Edge Function:', error);
        return throwError(() => new Error('Failed to fetch stations via Edge Function'));
      })
    );
  }

  // getStationById is primarily for fetching details of DB-sourced stations using internal ID.
  // For Google-sourced stations, the flow is: getStations -> (user interaction) -> NgRx triggers getGooglePlaceDetails.
  getStationById(id: string): Observable<Station | undefined> {
    // This method now primarily serves to get full details for stations ALREADY IN DB.
    // If you need details for a Google-sourced station not yet in DB or not fully detailed,
    // use the getGooglePlaceDetails method (via NgRx flow).
    console.log(`getStationById called for ID: ${id}. This should be an internal DB ID.`);

    return from(this.supabaseService.supabase.rpc('get_station_fuel_details', { target_station_id: id }))
      .pipe(
        map((response: any) => {
          if (response.error) {
            console.error(`Error fetching station with id ${id} from DB:`, response.error);
            throw new Error(response.error.message);
          }
          const stationData = response.data && response.data[0];
          if (!stationData) {
            return undefined;
          }
          return {
            id: stationData.station_id,
            name: stationData.name,
            brand: stationData.brand,
            address: stationData.address,
            latitude: stationData.latitude,
            longitude: stationData.longitude,
            distance: null,
            reliabilityScore: null,
            operatingHours: stationData.operating_hours ? {
              open: stationData.operating_hours.open_time || 'N/A',
              close: stationData.operating_hours.close_time || 'N/A',
              is24Hours: stationData.operating_hours.is_24_hours || false,
            } : null,
            fuelStatus: {
              petrol: (stationData.petrol_price !== null || stationData.petrol_available !== null || stationData.petrol_reported_at !== null) ? {
                price: stationData.petrol_price,
                available: stationData.petrol_available,
                queueLength: stationData.petrol_queue_length as FuelStatus['queueLength'],
                lastUpdated: stationData.petrol_reported_at
              } : undefined,
              diesel: (stationData.diesel_price !== null || stationData.diesel_available !== null || stationData.diesel_reported_at !== null) ? {
                price: stationData.diesel_price,
                available: stationData.diesel_available,
                queueLength: stationData.diesel_queue_length as FuelStatus['queueLength'],
                lastUpdated: stationData.diesel_reported_at
              } : undefined,
              kerosene: (stationData.kerosene_price !== null || stationData.kerosene_available !== null || stationData.kerosene_reported_at !== null) ? {
                price: stationData.kerosene_price,
                available: stationData.kerosene_available,
                queueLength: stationData.kerosene_queue_length as FuelStatus['queueLength'],
                lastUpdated: stationData.kerosene_reported_at
              } : undefined,
              gas: (stationData.gas_price !== null || stationData.gas_available !== null || stationData.gas_reported_at !== null) ? {
                price: stationData.gas_price,
                available: stationData.gas_available,
                queueLength: stationData.gas_queue_length as FuelStatus['queueLength'],
                lastUpdated: stationData.gas_reported_at
              } : undefined,
            },
            contact: { 
              phone: stationData.phone_number || null, 
              website: stationData.website_url || null 
            },
            lastReported: stationData.petrol_reported_at || stationData.diesel_reported_at || stationData.kerosene_reported_at || stationData.gas_reported_at || null,
            reportCount: stationData.report_count || null,
            source: 'db', // Mark as db source
            google_place_id: stationData.google_place_id || null,
            logoUrl: stationData.logo_url || null, // Assuming DB might store this from brand_info
            website: stationData.website_url || stationData.brand_website || null, // Prioritize station specific, then brand
            types: stationData.types || [], // Assuming DB might store this
            rawFuelPrices: stationData.raw_fuel_prices || null, // Assuming DB might store this from brand_info
          } as Station;
        }),
        catchError(error => {
          console.error(`Supabase RPC error in getStationById for DB id ${id}:`, error.message);
          return throwError(() => new Error(`Failed to fetch DB station ${id}: ${error.message}`));
        })
      );
  }

  /**
   * Fetches detailed information for a station from Google Places API via an Edge Function.
   * @param placeId The Google Place ID of the station.
   * @returns Observable<Partial<Station>> containing details to merge.
   */
  getGooglePlaceDetails(placeId: string): Observable<Partial<Station>> {
    return from(
      this.supabaseService.supabase.functions.invoke('get-google-place-details', {
        body: { place_id: placeId }, // Match Edge Function expected payload
      })
    ).pipe(
      map((response: any) => {
        if (response.error) {
          console.error(`Error calling get-google-place-details for placeId ${placeId}:`, response.error);
          throw new Error(response.error.message || 'Failed to invoke get-google-place-details');
        }
        const place = response.data; // The Edge Function should return the Google Place object
        if (!place) {
          throw new Error('No data returned from get-google-place-details');
        }

        // Map Google Place data to Partial<Station>
        const stationDetails: Partial<Station> = {
          name: place.displayName?.text || place.name, // Fallback for different API versions if any
          address: place.formattedAddress,
          latitude: place.location?.latitude,
          longitude: place.location?.longitude,
          google_place_id: place.id,
          contact: {
            phone: place.internationalPhoneNumber || place.nationalPhoneNumber || null,
            website: place.websiteUri || null,
          },
          operatingHours: place.regularOpeningHours ? {
            // Need to parse periods to HH:MM, is24Hours correctly.
            // This is a simplified example. Google API returns complex period structures.
            open: place.regularOpeningHours.weekdayText?.join(', ') || 'N/A', // Placeholder, needs proper parsing
            close: 'N/A', // Placeholder
            is24Hours: place.regularOpeningHours.openNow !== undefined ? false : true, // Heuristic, improve this
          } : null,
          types: place.types || [],
          // reliabilityScore, fuelStatus, brand, logoUrl might not be directly from here
          // but brand could be inferred or set if primaryType matches GasStationBrand
          // For now, these are not set here, allowing existing values (like from nearby-stations) to persist
          detailsFetched: true, // Mark that details have been fetched
          source: 'google', // Clarify source, though it should be already google
        };
        // Remove undefined fields to avoid overwriting existing valid data with undefined
        Object.keys(stationDetails).forEach(key => 
          (stationDetails as any)[key] === undefined && delete (stationDetails as any)[key]
        );
        if (stationDetails.contact && Object.keys(stationDetails.contact).length === 0) {
          delete stationDetails.contact;
        }
        if (stationDetails.operatingHours && Object.keys(stationDetails.operatingHours).length === 0) {
          delete stationDetails.operatingHours;
        }

        return stationDetails;
      }),
      catchError(error => {
        console.error(`Error in getGooglePlaceDetails for placeId ${placeId}:`, error);
        return throwError(() => new Error(`Failed to fetch Google Place details for ${placeId}`));
        })
      );
  }

  /**
   * Calls the 'ensure-station-reference' Edge Function to link a Google Place ID 
   * to an internal station record if it doesn't exist.
   * @param googlePlaceId The Google Place ID of the station.
   * @returns Observable<{ station_id: string; message: string }>
   */
  ensureStationReference(googlePlaceId: string): Observable<{ station_id: string; message: string }> {
    return from(
      this.supabaseService.supabase.functions.invoke('ensure-station-reference', {
        body: { google_place_id: googlePlaceId },
      })
    ).pipe(
      map((response: any) => {
        if (response.error) {
          console.error('Error calling ensure-station-reference Edge Function:', response.error);
          throw new Error(response.error.message || 'Failed to invoke ensure-station-reference');
        }
        return response.data; // Expects { station_id: string; message: string }
      }),
      catchError(error => {
        console.error('Error in ensureStationReference:', error);
        return throwError(() => new Error('Failed to ensure station reference'));
      })
    );
  }

  // submitFuelReport method is now removed from here
}