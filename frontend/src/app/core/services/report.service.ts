import { Injectable } from '@angular/core';
import { Observable, throwError, from } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { FuelReport } from '../models/fuel-report.model';
// No direct need for Store or StationActions here if the component dispatches actions

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  constructor(private supabaseService: SupabaseService) { }

  submitFuelReport(stationId: string, report: FuelReport): Observable<FuelReport> {
    return from(this.supabaseService.supabase.auth.getUser()).pipe(
      switchMap(userResponse => {
        const user = userResponse.data.user;
        if (!user) {
          return throwError(() => new Error('User not authenticated to submit report.'));
        }

        let dbFuelType: string;
        switch (report.fuelType) {
          case 'petrol': dbFuelType = 'Petrol'; break;
          case 'diesel': dbFuelType = 'Diesel'; break;
          case 'kerosene': dbFuelType = 'Kerosene'; break;
          case 'gas': dbFuelType = 'Gas'; break;
          default:
            console.error('Invalid fuel type in report:', report.fuelType);
            return throwError(() => new Error('Invalid fuel type provided.'));
        }

        const reportToInsert = {
          station_id: stationId,
          user_id: user.id,
          fuel_type: dbFuelType,
          price: report.price,
          is_available: report.available,
          queue_length: report.queueLength,
          comment: report.comment || null, // Ensure null if undefined
          // photo_url: report.photoUrl || null, // Ensure null if undefined, if this field exists in your DB
          // reported_at is handled by DB default
        };

        return from(this.supabaseService.supabase.from('fuel_reports').insert(reportToInsert).select().single()).pipe(
          map((response: any) => {
            if (response.error) {
              console.error('Error submitting fuel report:', response.error);
              // Rethrowing the Supabase error directly might be more informative
              throw response.error; 
            }
            const dbData = response.data;
            // Map the DB response back to the FuelReport model structure for consistency
            return {
              id: dbData.id,
              stationId: dbData.station_id,
              userId: dbData.user_id,
              fuelType: report.fuelType, // Use original client-side fuelType for the returned object
              available: dbData.is_available,
              price: dbData.price,
              queueLength: dbData.queue_length,
              comment: dbData.comment,
              // photoUrl: dbData.photo_url, 
              timestamp: dbData.created_at || dbData.reported_at || new Date().toISOString()
            } as FuelReport;
          }),
          catchError(error => {
            // Catch errors from the insert operation
            console.error('Supabase error during fuel report insert:', error);
            // It's often better to throw a new error or a more structured error object
            return throwError(() => new Error(error.message || 'Failed to submit fuel report to Supabase.'));
          })
        );
      }),
      catchError(authError => {
        // Catch errors from getUser or if an invalid fuel type was thrown before insert
        console.error('Authentication or setup error in submitFuelReport:', authError);
        return throwError(() => authError); // Re-throw the caught error
      })
    );
  }
} 