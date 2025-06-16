import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Station, FuelStatus } from '../../../core/models/station.model';
import { StationService } from '../../../core/services/station.service';
import { GasStationBrand } from '@shared/enums';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store';
import * as StationSelectors from '../../../store/selectors/station.selectors';
import { Observable } from 'rxjs';

interface FuelDisplayInfo {
  type: 'reported' | 'estimated' | 'none';
  available?: boolean;
  price?: number | null;
  queueLength?: string | null;
  displayText: string;
  statusClass: string;
}

@Component({
  selector: 'app-station-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card card-hover cursor-pointer relative rounded-xl overflow-hidden" (click)="onCardClick()">
      <!-- Loading/Linking Overlay -->
      <div *ngIf="(isLoadingDetails$ | async) || (isLinking$ | async)" class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
        <span class="ml-2 text-sm text-primary-700">{{ (isLinking$ | async) ? 'Linking...' : 'Loading details...' }}</span>
      </div>

      <!-- Header -->
      <div class="bg-gradient-to-r from-primary-500 to-primary-600 p-4 text-white flex items-start gap-3">
        <img *ngIf="station.logoUrl" [src]="station.logoUrl" alt="{{station.brand}} logo" class="h-12 w-12 object-contain rounded-sm bg-white p-0.5 flex-shrink-0">
        <div *ngIf="!station.logoUrl && station.brand" class="h-12 w-12 rounded-sm bg-primary-400 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
          {{ getBrandInitial(station.brand) }}
        </div>
        <div class="flex-grow">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-bold text-2xl leading-tight">{{station.name || 'Loading...'}}</h3>
              <p class="text-base text-primary-50">{{getBrandName(station.brand) || (station.source === 'google' ? 'Google Sourced' : 'Brand N/A')}}</p>
              <p *ngIf="station.distance !== null && station.distance !== undefined" class="text-sm text-primary-100">{{station.distance.toFixed(1)}} km away</p>
              <!-- Reliability Score in Header -->
              <div *ngIf="station.reliabilityScore !== null && station.reliabilityScore !== undefined" class="flex items-center gap-1 mt-1">
                <svg class="w-4 h-4 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                <span class="text-sm font-medium text-primary-100">
                  {{station.reliabilityScore.toFixed(1)}} Reliability ({{station.reportCount || 0}} reports)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Content -->
      <div class="p-4 space-y-4">
        <!-- Address -->
        <div class="flex items-start gap-2 text-sm text-neutral-700">
          <svg class="mt-0.5 w-4 h-4 text-primary-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
          </svg>
          <p>{{station.address || (station.source === 'google' && !(isLoadingDetails$ | async) ? 'Address not yet loaded' : 'Address not available')}}</p>
        </div>
        
        <!-- Fuel Status -->
        <div *ngIf="station.fuelStatus || station.rawFuelPrices">
          <div class="text-sm font-semibold text-neutral-800 mb-3">Fuel Status</div>
          <div class="space-y-2">
            <!-- Dynamic Fuel Items -->
            <div *ngFor="let fuelType of fuelTypesArray" class="fuel-item">
              <ng-container *ngIf="getFuelDisplayInfo(fuelType) as info">
                <div class="flex items-center justify-between p-2 rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors">
                  <div class="flex items-center gap-3">
                    <!-- Fuel Icon -->
                    <div class="w-8 h-8 rounded-full flex items-center justify-center" [ngClass]="getFuelIconColor(fuelType)">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path [attr.d]="getFuelIconPath(fuelType)"/>
                      </svg>
                    </div>
                    <!-- Fuel Name -->
                    <span class="font-medium text-sm text-neutral-700">{{getFuelTypeName(fuelType)}}</span>
                    <!-- Estimated Label -->
                    <span *ngIf="info.type === 'estimated'" class="text-xs px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded">est.</span>
                  </div>
                  <!-- Status/Price -->
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold" [ngClass]="info.statusClass">{{info.displayText}}</span>
                    <!-- Queue indicator for reported fuel -->
                    <span *ngIf="info.type === 'reported' && info.available && info.queueLength && info.queueLength !== 'None'" 
                          class="text-xs px-1.5 py-0.5 bg-warning-100 text-warning-700 rounded-full">
                      {{info.queueLength}}
                    </span>
                  </div>
                </div>
              </ng-container>
            </div>
          </div>
        </div>
        
        <!-- No Fuel Status -->
        <div *ngIf="!station.fuelStatus && !station.rawFuelPrices">
          <div class="text-sm font-semibold text-neutral-800 mb-2">Fuel Status</div>
          <div class="bg-neutral-100 text-neutral-600 p-4 rounded-lg text-center">
            <svg class="w-8 h-8 mx-auto mb-2 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.563M15 9.34c-1.44-1.122-3.08-1.34-5-1.34s-3.56.218-5 1.34"/>
            </svg>
            <p class="text-sm italic">No fuel status reported yet</p>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="pt-4 border-t border-neutral-200 text-xs flex items-center justify-between">
          <div class="flex items-center gap-1 text-neutral-600">
            <svg class="w-4 h-4 text-neutral-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
            </svg>
            <span class="text-sm font-medium">{{getTimeAgo(station.lastReported)}}</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StationCardComponent implements OnInit {
  @Input() station!: Station;
  @Output() stationSelected = new EventEmitter<Station>();

  isLoadingDetails$!: Observable<boolean>;
  isLinking$!: Observable<boolean>;
  
  // Define fuel types in display order
  fuelTypesArray: Array<'petrol' | 'diesel' | 'kerosene' | 'gas'> = ['petrol', 'diesel', 'kerosene', 'gas'];
  
  constructor(
    private router: Router,
    private stationService: StationService,
    private store: Store<AppState>
  ) {}

  ngOnInit(): void {
    if (this.station && this.station.id) {
      this.isLoadingDetails$ = this.store.select(StationSelectors.selectStationDetailsLoading(this.station.id));
      this.isLinking$ = this.store.select(StationSelectors.selectStationLinking(this.station.id));
    }
  }

  onCardClick(): void {
    this.stationSelected.emit(this.station);
  }

  getFuelDisplayInfo(fuelType: 'petrol' | 'diesel' | 'kerosene' | 'gas'): FuelDisplayInfo {
    // Check if we have reported fuel status
    const reportedStatus = this.station.fuelStatus?.[fuelType];
    if (reportedStatus !== undefined) {
      if (reportedStatus.available) {
        return {
          type: 'reported',
          available: true,
          price: reportedStatus.price,
          queueLength: reportedStatus.queueLength,
          displayText: reportedStatus.price ? `₦${reportedStatus.price}` : 'Available',
          statusClass: 'text-success-600'
        };
      } else {
        return {
          type: 'reported',
          available: false,
          displayText: 'Unavailable',
          statusClass: 'text-error-600'
        };
      }
    }

    // Check if we have estimated prices
    const estimatedPrice = this.station.rawFuelPrices?.[fuelType];
    if (estimatedPrice !== undefined && estimatedPrice !== null) {
      return {
        type: 'estimated',
        price: estimatedPrice,
        displayText: `₦${estimatedPrice}`,
        statusClass: 'text-neutral-600'
      };
    }

    // No data available
    return {
      type: 'none',
      displayText: 'N/A',
      statusClass: 'text-neutral-400'
    };
  }

  getFuelIconPath(fuelType: string): string {
    const icons = {
      petrol: 'M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z',
      diesel: 'M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z',
      kerosene: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      gas: 'M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z'
    };
    return icons[fuelType as keyof typeof icons] || icons.petrol;
  }

  getFuelIconColor(fuelType: string): string {
    const colors = {
      petrol: 'bg-blue-100 text-blue-600',
      diesel: 'bg-orange-100 text-orange-600', 
      kerosene: 'bg-purple-100 text-purple-600',
      gas: 'bg-green-100 text-green-600'
    };
    return colors[fuelType as keyof typeof colors] || colors.petrol;
  }

  getFuelTypeName(fuelType: string): string {
    const names = {
      petrol: 'Petrol',
      diesel: 'Diesel',
      kerosene: 'Kerosene',
      gas: 'Gas'
    };
    return names[fuelType as keyof typeof names] || fuelType;
  }

  getTimeAgo(dateString: string | null): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const hours = Math.floor(diffMins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  getBrandName(brand: GasStationBrand | null): string {
    if (!brand) return '';
    return GasStationBrand[brand as keyof typeof GasStationBrand] || brand.toString(); 
  }

  getBrandInitial(brand: GasStationBrand | null): string {
    const name = this.getBrandName(brand);
    return name ? name.charAt(0).toUpperCase() : '?';
  }
}