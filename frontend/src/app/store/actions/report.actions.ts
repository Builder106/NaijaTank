import { createAction, props } from '@ngrx/store';
import { FuelReport } from '../../core/models/fuel-report.model';

export const submitReport = createAction(
  '[Report Form] Submit Report',
  props<{ stationId: string, reportData: Omit<FuelReport, 'id' | 'userId' | 'timestamp'> }>() // userId and timestamp are set by service/DB
);

export const submitReportSuccess = createAction(
  '[Report API] Submit Report Success',
  props<{ submittedReport: FuelReport }>() // The report returned from the DB
);

export const submitReportFailure = createAction(
  '[Report API] Submit Report Failure',
  props<{ error: any }>()
);

export const clearReportSubmissionStatus = createAction(
  '[Report] Clear Submission Status'
); 