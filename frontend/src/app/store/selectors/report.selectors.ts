import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ReportState } from '../reducers/report.reducer'; // Adjust path if your reducer is elsewhere

// Feature selector for the 'report' slice of state
export const selectReportState = createFeatureSelector<ReportState>('report'); // Name of the slice in AppState

export const selectIsSubmittingReport = createSelector(
  selectReportState,
  (state: ReportState) => state.isSubmitting
);

export const selectReportSubmissionError = createSelector(
  selectReportState,
  (state: ReportState) => state.submissionError
); 