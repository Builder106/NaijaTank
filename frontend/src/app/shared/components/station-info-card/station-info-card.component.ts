import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Station } from '../../../core/models/station.model';
import { AppState } from '../../../store';
import * as StationActions from '../../../store/actions/station.actions';
import { GasStationBrand } from '@shared/enums';

@Component({
  selector: 'app-station-info-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div *ngIf="station" class="bg-white rounded-lg shadow-xl p-4 md:p-6 max-w-md mx-auto relative">
      <!-- Loading/Linking Overlay -->
      <div *ngIf="isLoadingDetails || isLinking" class="absolute inset-0 bg-white bg-opacity-80 flex flex-col items-center justify-center z-20 rounded-lg">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
        <p class="mt-3 text-sm text-primary-600 font-medium">
          {{ isLinking ? 'Verifying station...' : 'Loading details...' }}
        </p>
      </div>

      <div class="flex justify-between items-start mb-3">
        <div class="flex items-start gap-3 flex-grow min-w-0">
          <img *ngIf="station.logoUrl" [src]="station.logoUrl" alt="{{getBrandName(station.brand)}} logo" class="h-12 w-12 object-contain rounded-md bg-gray-100 p-1 flex-shrink-0">
          <div *ngIf="!station.logoUrl && station.brand" class="h-12 w-12 rounded-md bg-primary-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {{ getBrandInitial(station.brand) }}
          </div>
          <div class="flex-grow min-w-0">
            <h3 class="text-xl font-bold truncate" title="{{station.name}}">{{station.name}}</h3>
            <p class="text-xs text-gray-500 truncate" title="{{getBrandName(station.brand) || 'Unknown Brand'}}">
              {{getBrandName(station.brand) || 'Unknown Brand'}}
            </p>
            <p class="text-xs text-gray-500 truncate" title="{{station.address}}">{{station.address}}</p>
          </div>
        </div>
        <button 
          (click)="close.emit()"
          class="p-1.5 hover:bg-gray-200 rounded-full text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0 ml-2">
          <span class="sr-only">Close</span>
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
      
      <!-- Details Section -->
      <div class="space-y-3 text-sm mb-4 styled-info-card">
        <div *ngIf="station.contact?.phone" class="flex items-center">
          <span class="w-5 mr-2 text-gray-400">📞</span> {{station.contact?.phone}}
        </div>
        <div *ngIf="station.contact?.website" class="flex items-center">
          <span class="w-5 mr-2 text-gray-400">🌐</span> <a [href]="station.contact?.website" target="_blank" class="text-primary-600 hover:underline truncate">{{station.contact?.website}}</a>
        </div>
        <div *ngIf="station.operatingHours?.open && station.operatingHours?.open !== 'N/A'" class="flex items-center">
          <span class="w-5 mr-2 text-gray-400">🕒</span> {{formatOperatingHours(station.operatingHours)}}
        </div>
        <div *ngIf="station.types && station.types.length > 0" class="flex items-start">
          <span class="w-5 mr-2 text-gray-400 mt-0.5">🏷️</span> <span class="flex flex-wrap gap-1">
            <span *ngFor="let type of station.types.slice(0,3)" class="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-full text-xs">{{type.replace('_', ' ') | titlecase}}</span>
          </span>
        </div>
      </div>

      <!-- Fuel Status -->
      <div class="mb-4 styled-info-card">
        <h4 class="text-xs font-semibold text-gray-500 uppercase mb-1.5">Fuel Status</h4>
        <div class="space-y-1 text-sm" *ngIf="station.fuelStatus || station.rawFuelPrices">
          <ng-container *ngIf="station.fuelStatus as fs">
            <div class="flex justify-between items-center" *ngIf="fs.petrol !== undefined">
              <span>Petrol</span>
              <span [ngClass]="{ 'text-green-600': fs.petrol.available, 'text-red-600': !fs.petrol.available, 'font-medium': true }">
                {{ fs.petrol.available ? (fs.petrol.price ? '₦' + fs.petrol.price : 'Available') : 'Unavailable' }}
                <span *ngIf="fs.petrol.available && fs.petrol.queueLength && fs.petrol.queueLength !== 'None'" class="text-xs text-gray-500 ml-1">({{fs.petrol.queueLength}} queue)</span>
              </span>
            </div>
            <!-- Similar for Diesel, Kerosene, Gas -->
          </ng-container>
          <ng-container *ngIf="!station.fuelStatus && station.rawFuelPrices as rfp">
            <p class="text-xs text-gray-400 italic mb-1">(Estimated prices based on brand)</p>
            <div class="flex justify-between items-center text-gray-600" *ngIf="rfp.petrol !== undefined && rfp.petrol !== null">
              <span>Petrol (est.)</span> <span class="font-medium">₦{{rfp.petrol}}</span>
            </div>
            <div class="flex justify-between items-center text-gray-600" *ngIf="rfp.diesel !== undefined && rfp.diesel !== null">
              <span>Diesel (est.)</span> <span class="font-medium">₦{{rfp.diesel}}</span>
            </div>
          </ng-container>
          <div *ngIf="!station.fuelStatus && !station.rawFuelPrices" class="text-xs text-gray-500">(No fuel price information)</div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-2 pt-3 border-t border-gray-200 styled-info-card">
        <button (click)="reportFuel()" class="btn btn-primary btn-sm flex-1">Report Fuel</button>
        <button (click)="toggleFavorite()" class="btn btn-secondary btn-sm flex-1">Add to Favorites</button>
      </div>
    </div>
  `,
  styles: [`
    .truncate { /* Ensure Tailwind applies this if not already global */
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `]
})
export class StationInfoCardComponent implements OnInit {
  @Input() station: Station | null = null;
  @Input() isLoadingDetails: boolean = false;
  @Input() isLinking: boolean = false;
  @Output() close = new EventEmitter<void>();

  constructor(private store: Store<AppState>) { }

  ngOnInit(): void { }

  reportFuel(): void {
    if (!this.station) return;

    const reportActionPayload = { stationId: this.station.id }; // Placeholder, real navigation/action is next
    // This will be replaced by actual navigation to report form or dispatching a report modal action
    const navigateToReportFormAction = { 
      type: '[Navigation] Navigate To Fuel Report Form', 
      payload: reportActionPayload 
    };

    if (this.station.source === 'google' && this.station.id === this.station.google_place_id && this.station.google_place_id) {
      // It's a Google station not yet linked (using google_place_id as its main id in store)
      console.log(`StationInfoCard: Station ${this.station.name} is Google-sourced, ensuring reference before reporting fuel.`);
      this.store.dispatch(StationActions.ensureStationReference({
        station: this.station, // Pass the current station state
        onSuccessDispatchAction: { 
          ...navigateToReportFormAction, 
          // Crucially, use placeholder for stationId to be filled by effect
          payload: { ...navigateToReportFormAction.payload, stationId: 'USE_NEW_STATION_ID' } 
        }
        // Optionally, add onFailureDispatchAction to show a toast/message
      }));
    } else {
      // Already a DB station (source='db') or a Google station that has been linked (id is internal DB id)
      console.log(`StationInfoCard: Station ${this.station.name} is DB-sourced or linked. Proceeding to report fuel for ID: ${this.station.id}`);
      // Dispatch the action to navigate/open form directly with current (presumably internal) ID
      this.store.dispatch(navigateToReportFormAction);
    }
  }

  toggleFavorite(): void {
    if (!this.station) return;

    // Placeholder for actual favorite action type and payload structure
    const toggleFavAction = { 
      type: '[User] Toggle Favorite Station', 
      payload: { stationId: this.station.id } 
    };

    if (this.station.source === 'google' && this.station.id === this.station.google_place_id && this.station.google_place_id) {
      console.log(`StationInfoCard: Station ${this.station.name} is Google-sourced, ensuring reference before toggling favorite.`);
      this.store.dispatch(StationActions.ensureStationReference({
        station: this.station,
        onSuccessDispatchAction: { 
          ...toggleFavAction, 
          payload: { ...toggleFavAction.payload, stationId: 'USE_NEW_STATION_ID' } 
        }
      }));
    } else {
      console.log(`StationInfoCard: Station ${this.station.name} is DB-sourced or linked. Toggling favorite for ID: ${this.station.id}`);
      this.store.dispatch(toggleFavAction);
    }
  }
  
  getBrandName(brand: GasStationBrand | null): string {
    if (!brand) return '';
    return GasStationBrand[brand as keyof typeof GasStationBrand] || brand.toString(); 
  }

  getBrandInitial(brand: GasStationBrand | null): string {
    const name = this.getBrandName(brand);
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  formatOperatingHours(hours: Station['operatingHours']): string {
    if (!hours) return 'N/A';
    if (hours.is24Hours) return 'Open 24 hours';
    if (hours.open && hours.close && hours.open !== 'N/A') {
      return `${hours.open} - ${hours.close}`;
    }
    // If it's weekdayText from Google (which is an array of strings)
    if (Array.isArray(hours.open) && hours.open.length > 0) {
        return hours.open.join('; '); // Or pick current day
    }
    return 'Hours not available';
  }
}