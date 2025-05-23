import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError, tap } from 'rxjs/operators';
import { ReportService } from '../../core/services/report.service';
import * as ReportActions from '../actions/report.actions';
import * as StationActions from '../actions/station.actions'; // To update station list
// import { ToastService } from '../../core/services/toast.service'; // Assuming a toast service for global messages

@Injectable()
export class ReportEffects {

  submitReport$ = createEffect(() => this.actions$.pipe(
    ofType(ReportActions.submitReport),
    exhaustMap(action => {
      const fullReportDataForService = {
        // id, userId, timestamp will be handled by service/DB or are not part of initial submission data model
        ...action.reportData,
        stationId: action.stationId,
        // Fill in any missing required fields for FuelReport model if Omit<> made them optional but service expects them
        id: undefined, // Or however your model/service expects it for a new report
        userId: '', // Will be overridden by service
        timestamp: new Date().toISOString() // Placeholder, service will use actual
      } as any; // Cast as any if Omit causes issues here, ensure service handles it

      return this.reportService.submitFuelReport(action.stationId, fullReportDataForService).pipe(
        map(submittedReport => {
          // First, dispatch success for the report submission itself
          // Then, dispatch action to update the station data optimistically or with returned data
          // This sequence might need adjustment based on how/when you want station list to update
          return ReportActions.submitReportSuccess({ submittedReport });
        }),
        catchError(error => of(ReportActions.submitReportFailure({ error })))
      );
    })
  ));

  // Optional: Effect to show success toast and update station list
  submitReportSuccessGlobal$ = createEffect(() => this.actions$.pipe(
    ofType(ReportActions.submitReportSuccess),
    tap(action => {
      // this.toastService.show('Report submitted successfully!', { classname: 'bg-success text-light', delay: 5000 });
      console.log('Report submitted successfully:', action.submittedReport);
      // IMPORTANT: Dispatch action to update station data in the stations slice of the store
      // This ensures the station list/details reflect the new report
      // The reducer for StationActions.reportFuelStatusSuccess handles the optimistic update logic
    }),
    // We need to dispatch StationActions.reportFuelStatusSuccess here.
    // The payload for StationActions.reportFuelStatusSuccess is { stationId: string, report: FuelReport }
    map(action => StationActions.reportFuelStatusSuccess({ 
        stationId: action.submittedReport.stationId, 
        report: action.submittedReport 
    }))
  ), { dispatch: true }); // Ensure this effect can dispatch other actions

  // Optional: Effect to show error toast
  submitReportFailureGlobal$ = createEffect(() => this.actions$.pipe(
    ofType(ReportActions.submitReportFailure),
    tap(action => {
      // this.toastService.show(`Report submission failed: ${action.error.message || 'Unknown error'}`, { classname: 'bg-danger text-light', delay: 7000 });
      console.error('Report submission failed:', action.error);
    })
  ), { dispatch: false }); // This effect only shows a toast, doesn't dispatch other actions


  constructor(
    private actions$: Actions,
    private reportService: ReportService,
    // private toastService: ToastService // Inject if using a toast service
  ) {}
} 