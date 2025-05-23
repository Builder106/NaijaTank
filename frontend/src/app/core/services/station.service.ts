import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http'; // HttpClient likely no longer needed
import { Observable, of, throwError, from, switchMap } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Station, FuelStatus, StationOperatingHours } from '../models/station.model';
// FuelReport import is no longer needed here
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
  // private apiUrl = `${environment.apiUrl}/stations`; // Comment out or remove if not used
  
  // Mock data for development
  private mockStations: Station[] = [
    {
      id: '1',
      name: 'Total Energies Lekki',
      brand: 'Total',
      address: '12 Admiralty Way, Lekki Phase 1, Lagos',
      latitude: 6.4281,
      longitude: 3.4219,
      distance: 1.2,
      reliabilityScore: 4.5,
      operatingHours: {
        open: '06:00',
        close: '22:00',
        is24Hours: false
      },
      fuelStatus: {
        petrol: {
          available: true,
          price: 600,
          queueLength: 'Short',
          lastUpdated: new Date().toISOString()
        },
        diesel: {
          available: true,
          price: 700,
          queueLength: 'None',
          lastUpdated: new Date().toISOString()
        },
        kerosene: {
          available: false,
          price: null,
          queueLength: null,
          lastUpdated: new Date().toISOString()
        }
      },
      contact: {
        phone: '+2348012345678',
        website: 'https://totalenergies.ng'
      },
      lastReported: new Date().toISOString(),
      reportCount: 15
    },
    {
      id: '2',
      name: 'NNPC Retail Ikoyi',
      brand: 'NNPC',
      address: '45 Awolowo Road, Ikoyi, Lagos',
      latitude: 6.4432,
      longitude: 3.4162,
      distance: 2.5,
      reliabilityScore: 3.8,
      operatingHours: {
        open: '00:00',
        close: '00:00',
        is24Hours: true
      },
      fuelStatus: {
        petrol: {
          available: true,
          price: 580,
          queueLength: 'Medium',
          lastUpdated: new Date().toISOString()
        },
        diesel: {
          available: true,
          price: 680,
          queueLength: 'Short',
          lastUpdated: new Date().toISOString()
        },
        kerosene: {
          available: true,
          price: 800,
          queueLength: 'None',
          lastUpdated: new Date().toISOString()
        }
      },
      contact: {
        phone: '+2348023456789',
        website: 'https://nnpcgroup.com'
      },
      lastReported: new Date().toISOString(),
      reportCount: 8
    },
    {
      id: '3',
      name: 'Mobil Surulere',
      brand: 'Mobil',
      address: '24 Adeniran Ogunsanya St, Surulere, Lagos',
      latitude: 6.5015,
      longitude: 3.3615,
      distance: 4.7,
      reliabilityScore: 4.2,
      operatingHours: {
        open: '05:00',
        close: '23:00',
        is24Hours: false
      },
      fuelStatus: {
        petrol: {
          available: false,
          price: 610,
          queueLength: null,
          lastUpdated: new Date().toISOString()
        },
        diesel: {
          available: true,
          price: 720,
          queueLength: 'None',
          lastUpdated: new Date().toISOString()
        },
        kerosene: {
          available: false,
          price: null,
          queueLength: null,
          lastUpdated: new Date().toISOString()
        }
      },
      contact: {
        phone: '+2348034567890',
        website: null
      },
      lastReported: new Date().toISOString(),
      reportCount: 12
    }
  ];

  constructor(
    // private http: HttpClient, // Remove if not used elsewhere
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
          operatingHours: item.operatingHours || { open: 'N/A', close: 'N/A', is24Hours: false } as StationOperatingHours, // Provide default
          fuelStatus: item.fuelStatus || {} as FuelStatus, // Provide default
          contact: item.contact || { phone: null, website: null }, // Provide default
          lastReported: item.lastReported || new Date(0).toISOString(),
          reportCount: item.reportCount,
          source: item.source, // 'db' or 'google'
          google_place_id: item.google_place_id, 
        } as Station)); // Casting to Station, ensure your Station model can accommodate these fields (especially source and google_place_id)
      }),
      catchError(error => {
        console.error('Error in getStations calling Edge Function:', error);
        return throwError(() => new Error('Failed to fetch stations via Edge Function'));
      })
    );
  }

  // getStationById needs to be refactored to handle both DB and Google Place IDs
  // and potentially fetch from Google Places API for google_place_id if not fully detailed by nearby-stations
  getStationById(id: string, source?: 'db' | 'google'): Observable<Station | undefined> {
    if (source === 'google') {
      // TODO: Implement fetching full details from Google Places API using the 'id' (which is google_place_id)
      // This might involve another Edge Function to proxy the call or direct client-side SDK usage.
      // For now, return undefined or a partially filled station if `nearby-stations` provided enough.
      console.warn(`getStationById for source 'google' (place_id: ${id}) needs full Google Places Details call - not yet implemented here.`);
      // You could try to find it in a cached list from a previous getStations call if available for basic info.
      return of(undefined); 
    }

    // Assuming 'id' is an internal DB ID for source 'db' or if source is undefined
    // This part reuses the old RPC logic, ensure 'get_station_fuel_details' is still relevant for internal IDs.
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
            operatingHours: { open: '00:00', close: '00:00', is24Hours: true },
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
            contact: { phone: null, website: null },
            lastReported: stationData.petrol_reported_at || stationData.diesel_reported_at || stationData.kerosene_reported_at || stationData.gas_reported_at || new Date(0).toISOString(),
            reportCount: null,
            source: 'db' // Mark as db source
          } as Station;
        }),
        catchError(error => {
          console.error(`Supabase RPC error in getStationById for DB id ${id}:`, error.message);
          return throwError(() => new Error(`Failed to fetch DB station ${id}: ${error.message}`));
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