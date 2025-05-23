import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Station } from '../../../core/models/station.model';
import { StationService } from '../../../core/services/station.service';

@Component({
  selector: 'app-station-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card card-hover cursor-pointer" (click)="onCardClick()">
      <!-- Header -->
      <div class="bg-primary-500 p-4 text-white">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-bold text-lg">{{station.name || 'Loading...'}}</h3>
            <p class="text-sm text-primary-100">{{station.brand || (station.source === 'google' ? 'Google Sourced' : 'N/A')}}</p>
          </div>
          <div class="flex flex-col items-end" *ngIf="station.distance !== null">
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
          <p>{{station.address || (station.source === 'google' ? 'Fetching address...' : 'Address not available')}}</p>
        </div>
        
        <!-- Fuel Status -->
        <div class="space-y-2" *ngIf="station.fuelStatus">
          <!-- Petrol Status -->
          <div *ngIf="station.fuelStatus.petrol !== undefined" class="flex items-center justify-between">
            <span class="text-sm font-medium text-neutral-700">Petrol:</span>
            <div [ngClass]="{
              'badge badge-success': station.fuelStatus.petrol.available,
              'badge badge-error': !station.fuelStatus.petrol.available
            }">
              <span *ngIf="station.fuelStatus.petrol.available">
                ₦{{station.fuelStatus.petrol.price}}
                <span *ngIf="station.fuelStatus.petrol.queueLength" class="ml-1 opacity-75">
                  ({{station.fuelStatus.petrol.queueLength}} Queue)
                </span>
              </span>
              <span *ngIf="!station.fuelStatus.petrol.available">Unavailable</span>
            </div>
          </div>
          <div *ngIf="station.fuelStatus.petrol === undefined" class="flex items-center justify-between">
             <span class="text-sm font-medium text-neutral-700">Petrol:</span>
             <span class="badge badge-ghost">N/A</span>
          </div>

          <!-- Diesel Status -->
          <div *ngIf="station.fuelStatus.diesel !== undefined" class="flex items-center justify-between">
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
          <div *ngIf="station.fuelStatus.diesel === undefined" class="flex items-center justify-between">
             <span class="text-sm font-medium text-neutral-700">Diesel:</span>
             <span class="badge badge-ghost">N/A</span>
          </div>

          <!-- Kerosene Status -->
          <div *ngIf="station.fuelStatus.kerosene !== undefined" class="flex items-center justify-between">
            <span class="text-sm font-medium text-neutral-700">Kerosene:</span>
            <div [ngClass]="{
              'badge badge-success': station.fuelStatus.kerosene.available,
              'badge badge-error': !station.fuelStatus.kerosene.available
            }">
              <span *ngIf="station.fuelStatus.kerosene.available">
                ₦{{station.fuelStatus.kerosene.price}}
              </span>
              <span *ngIf="!station.fuelStatus.kerosene.available">Unavailable</span>
            </div>
          </div>
          <div *ngIf="station.fuelStatus.kerosene === undefined" class="flex items-center justify-between">
             <span class="text-sm font-medium text-neutral-700">Kerosene:</span>
             <span class="badge badge-ghost">N/A</span>
          </div>

          <!-- Gas Status -->
          <div *ngIf="station.fuelStatus.gas !== undefined" class="flex items-center justify-between">
            <span class="text-sm font-medium text-neutral-700">Gas:</span>
            <div [ngClass]="{
              'badge badge-success': station.fuelStatus.gas.available,
              'badge badge-error': !station.fuelStatus.gas.available
            }">
              <span *ngIf="station.fuelStatus.gas.available">
                ₦{{station.fuelStatus.gas.price}}
              </span>
              <span *ngIf="!station.fuelStatus.gas.available">Unavailable</span>
            </div>
          </div>
          <div *ngIf="station.fuelStatus.gas === undefined" class="flex items-center justify-between">
             <span class="text-sm font-medium text-neutral-700">Gas:</span>
             <span class="badge badge-ghost">N/A</span>
          </div>
        </div>
        <div class="space-y-2" *ngIf="!station.fuelStatus">
          <p class="text-sm text-neutral-500">Fuel status not available.</p>
        </div>
        
        <!-- Footer -->
        <div class="flex items-center justify-between pt-2 border-t border-neutral-200">
          <div class="flex items-center gap-1 text-sm text-neutral-500">
            <span class="w-4 h-4 text-neutral-400">🕒</span>
            <span>{{getTimeAgo(station.lastReported)}}</span>
          </div>
          
          <div *ngIf="station.reliabilityScore !== null" class="flex items-center gap-1">
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
  
  constructor(
    private router: Router,
    private stationService: StationService
  ) {}

  onCardClick(): void {
    if (this.station.source === 'google' && this.station.google_place_id) {
      // For Google-sourced stations, first ensure the reference exists in our DB
      // and get the internal ID.
      this.stationService.ensureStationReference(this.station.google_place_id).subscribe({
        next: (response) => {
          // Navigate to the station detail page using the internal NaijaTank ID
          this.router.navigate(['/stations', response.station_id]);
        },
        error: (err) => {
          console.error('Error ensuring station reference:', err);
          // Optionally, navigate to an error page or show a toast message
          // For now, just log it and don't navigate, or navigate to a generic view of the google place id
          // this.router.navigate(['/stations', this.station.google_place_id, { queryParams: { source: 'google' } }]);
        }
      });
    } else if (this.station.source === 'db' && this.station.id) {
      // For DB-sourced stations, navigate directly with its ID
      this.router.navigate(['/stations', this.station.id]);
    } else if (this.station.id) {
      // Fallback for stations where source might not be explicitly set but have an ID (treat as DB station)
      console.warn('Station source not specified, navigating with existing ID:', this.station.id);
      this.router.navigate(['/stations', this.station.id]);
    } else {
      console.error('Station has no navigable ID or source information:', this.station);
      // Handle cases where navigation isn't possible (e.g., show an error or do nothing)
    }
  }

  getTimeAgo(dateString: string | null): string {
    if (!dateString) return 'N/A';
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