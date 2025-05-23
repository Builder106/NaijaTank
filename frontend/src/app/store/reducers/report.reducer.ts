import { createReducer, on } from '@ngrx/store';
import * as ReportActions from '../actions/report.actions';

export interface ReportState {
  isSubmitting: boolean;
  submissionError: any | null;
}

export const initialState: ReportState = {
  isSubmitting: false,
  submissionError: null,
};

export const reportReducer = createReducer(
  initialState,
  on(ReportActions.submitReport, (state) => ({
    ...state,
    isSubmitting: true,
    submissionError: null,
  })),
  on(ReportActions.submitReportSuccess, (state) => ({
    ...state,
    isSubmitting: false,
    submissionError: null, // Clear error on success
  })),
  on(ReportActions.submitReportFailure, (state, { error }) => ({
    ...state,
    isSubmitting: false,
    submissionError: error,
  })),
  on(ReportActions.clearReportSubmissionStatus, (state) => ({
    ...initialState // Reset to initial state
  }))
); 