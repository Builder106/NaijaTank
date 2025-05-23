import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Store, select } from '@ngrx/store';
import { Subscription, Observable } from 'rxjs';
import { AppState } from '../../../../store'; // Adjust path if needed
import { ReportService } from '../../../../core/services/report.service';
import { StationService } from '../../../../core/services/station.service';
import { FuelReport } from '../../../../core/models/fuel-report.model';
import * as ReportActions from '../../../../store/actions/report.actions'; // Import ReportActions
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component'; // Assuming a navbar
import { LoaderComponent } from '../../../../shared/components/loader/loader.component'; // Assuming a loader
import { selectIsSubmittingReport, selectReportSubmissionError } from '../../../../store/selectors/report.selectors';

@Component({
  selector: 'app-fuel-report-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    NavbarComponent,
    LoaderComponent
  ],
  template: `
    <app-navbar></app-navbar>
    <div class="container mx-auto p-4 max-w-2xl">
      <div class="bg-white shadow-xl rounded-lg p-6 md:p-8">
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Report Fuel Status</h1>
        
        <div *ngIf="stationName" class="mb-4 p-3 bg-primary-50 rounded-md">
          <p class="text-sm text-gray-700">Reporting for station: 
            <strong class="text-primary-600">{{ stationName }}</strong>
          </p>
        </div>

        <form [formGroup]="reportForm" (ngSubmit)="onSubmit()">
          <!-- Fuel Type -->
          <div class="mb-4">
            <label for="fuelType" class="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
            <select id="fuelType" formControlName="fuelType" class="select select-bordered w-full">
              <option value="petrol">Petrol (PMS)</option>
              <option value="diesel">Diesel (AGO)</option>
              <option value="kerosene">Kerosene (DPK)</option>
              <option value="gas">Gas (LPG)</option>
            </select>
            <div *ngIf="reportForm.get('fuelType')?.invalid && reportForm.get('fuelType')?.touched" class="text-error text-xs mt-1">
              Fuel type is required.
            </div>
          </div>

          <!-- Availability -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Availability</label>
            <div class="flex items-center gap-4">
              <label class="flex items-center cursor-pointer">
                <input type="radio" formControlName="available" [value]="true" class="radio radio-primary mr-2">
                <span class="text-sm">Available</span>
              </label>
              <label class="flex items-center cursor-pointer">
                <input type="radio" formControlName="available" [value]="false" class="radio radio-primary mr-2">
                <span class="text-sm">Unavailable</span>
              </label>
            </div>
          </div>

          <!-- Price (visible if available) -->
          <div *ngIf="reportForm.get('available')?.value === true" class="mb-4">
            <label for="price" class="block text-sm font-medium text-gray-700 mb-1">Price (per litre)</label>
            <input type="number" id="price" formControlName="price" placeholder="e.g., 650.50" class="input input-bordered w-full">
            <div *ngIf="reportForm.get('price')?.invalid && reportForm.get('price')?.touched" class="text-error text-xs mt-1">
              Valid price is required if available.
            </div>
          </div>

          <!-- Queue Length (visible if available) -->
          <div *ngIf="reportForm.get('available')?.value === true" class="mb-4">
            <label for="queueLength" class="block text-sm font-medium text-gray-700 mb-1">Queue Length</label>
            <select id="queueLength" formControlName="queueLength" class="select select-bordered w-full">
              <option value="None">None</option>
              <option value="Short">Short</option>
              <option value="Medium">Medium</option>
              <option value="Long">Long</option>
            </select>
          </div>
          
          <!-- Comment -->
          <div class="mb-6">
            <label for="comment" class="block text-sm font-medium text-gray-700 mb-1">Additional Comments (Optional)</label>
            <textarea id="comment" formControlName="comment" rows="3" placeholder="e.g., Pumps not working, specific pump has issues..." class="textarea textarea-bordered w-full"></textarea>
          </div>

          <div *ngIf="(submissionError$ | async) as errorMsg" class="p-3 my-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
            {{ errorMsg.message || errorMsg }}
          </div>

          <button type="submit" class="btn btn-primary w-full" [disabled]="reportForm.invalid || (submitting$ | async)">
            <app-loader *ngIf="submitting$ | async" [inline]="true" [size]="'sm'"></app-loader>
            <span *ngIf="!(submitting$ | async)">Submit Report</span>
          </button>
        </form>
      </div>
    </div>
  `
})
export class FuelReportFormComponent implements OnInit, OnDestroy {
  reportForm!: FormGroup;
  stationId: string | null = null;
  stationName: string | null = null; // To display which station is being reported for
  
  submitting$: Observable<boolean>;
  submissionError$: Observable<any | null>;

  private routeSub!: Subscription;
  private stationSub!: Subscription;
  private successSub!: Subscription;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private reportService: ReportService,
    private stationService: StationService,
    private store: Store<AppState>
  ) {
    this.submitting$ = this.store.pipe(select(selectIsSubmittingReport));
    this.submissionError$ = this.store.pipe(select(selectReportSubmissionError));
  }

  ngOnInit(): void {
    this.reportForm = this.fb.group({
      fuelType: ['', Validators.required],
      available: [true, Validators.required],
      price: [null],
      queueLength: ['None'],
      comment: ['']
    });

    this.routeSub = this.route.queryParams.subscribe(params => {
      this.stationId = params['stationId'] || null;
      const initialFuelType = params['fuelType'];
      if (initialFuelType) {
        this.reportForm.get('fuelType')?.setValue(initialFuelType);
      }
      if (this.stationId) {
        // Fetch station name to display
        this.stationSub = this.stationService.getStationById(this.stationId).subscribe(station => {
          if (station) this.stationName = station.name;
        });
      }
    });

    // Add conditional validators for price based on availability
    this.reportForm.get('available')?.valueChanges.subscribe(isAvailable => {
      const priceControl = this.reportForm.get('price');
      if (isAvailable) {
        priceControl?.setValidators([Validators.required, Validators.min(0)]);
      } else {
        priceControl?.clearValidators();
        priceControl?.setValue(null); // Clear price if not available
        this.reportForm.get('queueLength')?.setValue('None'); // Reset queue if not available
      }
      priceControl?.updateValueAndValidity();
    });

    // Listen for successful submission to navigate and clear status
    this.successSub = this.store.pipe(select(ReportActions.submitReportSuccess)).subscribe(action => {
      if(action) { // Check if action is not the initial undefined state
          // TODO: Show success toast
          console.log('Report submission successful, navigating...');
          if (this.stationId) {
            this.router.navigate(['/stations', this.stationId]);
          }
          this.store.dispatch(ReportActions.clearReportSubmissionStatus());
      }
    });
  }

  onSubmit(): void {
    if (this.reportForm.invalid || !this.stationId) {
      let errorMsg = !this.stationId ? 'Station ID is missing.' : 'Please correct the form errors.';
      this.store.dispatch(ReportActions.submitReportFailure({ error: { message: errorMsg } })); // Dispatch to set error in store
      Object.values(this.reportForm.controls).forEach(control => {
        control.markAsTouched();
      });
      return;
    }

    const formValue = this.reportForm.value;
    // Construct only the data needed for the action, matching Omit<> in the action definition
    const reportData: Omit<FuelReport, 'id' | 'userId' | 'timestamp'> = {
      stationId: this.stationId, // stationId is part of action payload, not reportData for service
      fuelType: formValue.fuelType,
      available: formValue.available,
      price: formValue.available ? formValue.price : null,
      queueLength: formValue.available ? formValue.queueLength : null,
      comment: formValue.comment || undefined,
    };

    this.store.dispatch(ReportActions.submitReport({ stationId: this.stationId, reportData }));
  }

  ngOnDestroy(): void {
    if (this.routeSub) this.routeSub.unsubscribe();
    if (this.stationSub) this.stationSub.unsubscribe();
    if (this.successSub) this.successSub.unsubscribe();
    // Optionally clear status on destroy if not cleared on success navigation
    // this.store.dispatch(ReportActions.clearReportSubmissionStatus()); 
  }
} 