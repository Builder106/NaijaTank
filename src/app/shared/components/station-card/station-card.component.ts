import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Station } from '../../../core/models/station.model';

@Component({
  selector: 'app-station-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card card-hover">
      <!-- Header -->
      <div class="bg-primary-500 p-4 text-white">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-bold text-lg">{{station.name}}</h3>
            <p class="text-sm text-primary-100">{{station.brand}}</p>
          </div>
          <div class="flex flex-col items-end">
            <p class="text-2xl font-bold">{{station.distance}}</p>
            <p class="text-sm text-primary-100">km away</p>
          </div>
        </div>
      </div>
      
      <!-- Content -->
      <div class="p-4 space-y-4">
        <!-- Address -->
        <div class="flex items-start gap-2 text-sm text-neutral-600">
          <span class="mt-1 w-4 h-4 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
            📍
          </span>
          <p>{{station.address}}</p>
        </div>
        
        <!-- Fuel Status -->
        <div class="space-y-2">
          <!-- PMS Status -->
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-neutral-700">PMS:</span>
            <div [ngClass]="{
              'badge badge-success': station.fuelStatus.pms.available,
              'badge badge-error': !station.fuelStatus.pms.available
            }">
              <span *ngIf="station.fuelStatus.pms.available">
                ₦{{station.fuelStatus.pms.price}}
                <span *ngIf="station.fuelStatus.pms.queueLength" class="ml-1 opacity-75">
                  ({{station.fuelStatus.pms.queueLength}} Queue)
                </span>
              </span>
              <span *ngIf="!station.fuelStatus.pms.available">Unavailable</span>
            </div>
          </div>

          <!-- Diesel Status -->
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-neutral-700">Diesel:</span>
            <div [ngClass]="{
              'badge badge-success': station.fuelStatus.diesel.available,
              'badge badge-error': !station.fuelStatus.diesel.available
            }">
              <span *ngIf="station.fuelStatus.diesel.available">
                ₦{{station.fuelStatus.diesel.price}}
              </span>
              <span *ngIf="!station.fuelStatus.diesel.available">Unavailable</span>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="flex items-center justify-between pt-2 border-t border-neutral-200">
          <div class="flex items-center gap-1 text-sm text-neutral-500">
            <span class="w-4 h-4 text-neutral-400">🕒</span>
            <span>{{getTimeAgo(station.lastReported)}}</span>
          </div>
          
          <div class="flex items-center gap-1">
            <span class="w-4 h-4 text-warning-500">⭐</span>
            <span class="text-sm font-medium text-neutral-700">
              {{station.reliabilityScore.toFixed(1)}}
            </span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StationCardComponent {
  @Input() station!: Station;
  
  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffMins / 1440);
      return `${days}d ago`;
    }
  }
}