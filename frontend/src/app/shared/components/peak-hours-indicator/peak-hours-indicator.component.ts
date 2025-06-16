import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PeakHours } from '../../../core/models/station.model';

@Component({
  selector: 'app-peak-hours-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center space-x-2 text-xs">
      <div class="flex items-center space-x-1">
        <div class="w-2 h-2 rounded-full" [class]="getStatusIndicatorClass()"></div>
        <span [class]="getStatusTextClass()">{{ getStatusText() }}</span>
      </div>
      
      <div *ngIf="getNextBusyPeriod()" class="text-gray-500 dark:text-gray-400">
        • Usually busy {{ getNextBusyPeriod() }}
      </div>
    </div>
  `
})
export class PeakHoursIndicatorComponent {
  @Input() peakHours!: PeakHours;

  getStatusIndicatorClass(): string {
    switch (this.peakHours.currentStatus) {
      case 'quiet':
        return 'bg-green-500';
      case 'normal':
        return 'bg-blue-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'very_busy':
        return 'bg-red-500 animate-pulse';
      default:
        return 'bg-gray-400';
    }
  }

  getStatusTextClass(): string {
    switch (this.peakHours.currentStatus) {
      case 'quiet':
        return 'text-green-600 dark:text-green-400';
      case 'normal':
        return 'text-blue-600 dark:text-blue-400';
      case 'busy':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'very_busy':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-500';
    }
  }

  getStatusText(): string {
    switch (this.peakHours.currentStatus) {
      case 'quiet':
        return 'Quiet now';
      case 'normal':
        return 'Normal traffic';
      case 'busy':
        return 'Busy now';
      case 'very_busy':
        return 'Very busy';
      default:
        return 'Unknown';
    }
  }

  getNextBusyPeriod(): string | null {
    const currentHour = new Date().getHours();
    
    for (const period of this.peakHours.busyPeriods) {
      const startHour = parseInt(period.start.split(':')[0]);
      if (startHour > currentHour) {
        return `${period.start}-${period.end}`;
      }
    }
    
    // If no period today, return tomorrow's first period
    if (this.peakHours.busyPeriods.length > 0) {
      const firstPeriod = this.peakHours.busyPeriods[0];
      return `${firstPeriod.start}-${firstPeriod.end} tomorrow`;
    }
    
    return null;
  }
}