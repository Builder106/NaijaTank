import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvailabilityPrediction } from '../../../core/models/station.model';

@Component({
  selector: 'app-availability-prediction',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="prediction.likelyToRunOut" 
         class="flex items-center space-x-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-md border border-orange-200 dark:border-orange-800">
      <svg class="w-4 h-4 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
      </svg>
      <div class="flex-1 min-w-0">
        <p class="text-xs font-medium text-orange-800 dark:text-orange-200">
          Likely to run out {{ prediction.estimatedTime ? 'by ' + prediction.estimatedTime : 'soon' }}
        </p>
        <p class="text-xs text-orange-600 dark:text-orange-300">
          {{ prediction.confidence }}% confidence
        </p>
      </div>
    </div>
  `
})
export class AvailabilityPredictionComponent {
  @Input() prediction!: AvailabilityPrediction;
}