import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Station } from '../../../core/models/station.model';
import { StationService } from '../../../core/services/station.service';
import { GasStationBrand } from '@shared/enums';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store';
import * as StationSelectors from '../../../store/selectors/station.selectors';
import { Observable } from 'rxjs';

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
        
        <!-- Fuel Status (from station.fuelStatus or station.rawFuelPrices as fallback) -->
        <div *ngIf="station.fuelStatus || station.rawFuelPrices">
          <div class="text-sm font-semibold text-neutral-800 mb-2">Fuel Status</div>
          <div class="space-y-2 text-xs">
            <ng-container *ngIf="station.fuelStatus as fs">
              <div *ngIf="fs.petrol !== undefined" class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-neutral-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                  </svg>
                  <span class="font-medium text-neutral-700">Petrol</span>
                </div>
                <div [ngClass]="{ 
                  'px-2 py-0.5 rounded-full text-xs font-semibold bg-success-100 text-success-700': fs.petrol.available, 
                  'px-2 py-0.5 rounded-full text-xs font-semibold bg-error-100 text-error-700': !fs.petrol.available 
                }">
                  <span *ngIf="fs.petrol.available">₦{{fs.petrol.price}}<span *ngIf="fs.petrol.queueLength" class="ml-1 opacity-75"> ({{fs.petrol.queueLength}})</span></span>
                  <span *ngIf="!fs.petrol.available">Unavailable</span>
                </div>
              </div>
              <div *ngIf="fs.petrol === undefined && station.rawFuelPrices?.petrol !== undefined" class="flex items-center justify-between text-neutral-500">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                  </svg>
                  <span class="font-medium text-neutral-700">Petrol (est.)</span>
                </div>
                <span>{{ station.rawFuelPrices?.petrol ? ('₦' + station.rawFuelPrices!.petrol) : 'N/A'}}</span>
              </div>

              <!-- Diesel -->
              <div *ngIf="fs.diesel !== undefined" class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-neutral-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                  </svg>
                  <span class="font-medium text-neutral-700">Diesel</span>
                </div>
                <div [ngClass]="{ 
                  'px-2 py-0.5 rounded-full text-xs font-semibold bg-success-100 text-success-700': fs.diesel.available, 
                  'px-2 py-0.5 rounded-full text-xs font-semibold bg-error-100 text-error-700': !fs.diesel.available 
                }">
                  <span *ngIf="fs.diesel.available">₦{{fs.diesel.price}}</span>
                  <span *ngIf="!fs.diesel.available">Unavailable</span>
                </div>
              </div>
              <div *ngIf="fs.diesel === undefined && station.rawFuelPrices?.diesel !== undefined" class="flex items-center justify-between text-neutral-500">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                  </svg>
                  <span class="font-medium text-neutral-700">Diesel (est.)</span>
                </div>
                <span>{{ station.rawFuelPrices?.diesel ? ('₦' + station.rawFuelPrices!.diesel) : 'N/A'}}</span>
              </div>

            </ng-container>
            <ng-container *ngIf="!station.fuelStatus && station.rawFuelPrices as rfp"> 
              <!-- Fallback to rawFuelPrices if fuelStatus is completely null -->
              <p class="text-xs italic text-neutral-500 mb-1">(Estimated prices based on brand)</p>
              <div *ngIf="rfp.petrol !== undefined && rfp.petrol !== null" class="flex items-center justify-between text-neutral-500">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                  </svg>
                  <span class="font-medium text-neutral-700">Petrol (est.)</span>
                </div>
                <span>₦{{rfp.petrol}}</span>
              </div>
              <div *ngIf="rfp.diesel !== undefined && rfp.diesel !== null" class="flex items-center justify-between text-neutral-500">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                  </svg>
                  <span class="font-medium text-neutral-700">Diesel (est.)</span>
                </div>
                <span>₦{{rfp.diesel}}</span>
              </div>
              <div *ngIf="rfp.kerosene !== undefined && rfp.kerosene !== null" class="flex items-center justify-between text-neutral-500">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                  </svg>
                  <span class="font-medium text-neutral-700">Kerosene (est.)</span>
                </div>
                <span>₦{{rfp.kerosene}}</span>
              </div>
              <div *ngIf="rfp.gas !== undefined && rfp.gas !== null" class="flex items-center justify-between text-neutral-500">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                  </svg>
                  <span class="font-medium text-neutral-700">Gas (est.)</span>
                </div>
                <span>₦{{rfp.gas}}</span>
              </div>
            </ng-container>
          </div>
        </div>
        <div *ngIf="!station.fuelStatus && !station.rawFuelPrices">
          <div class="text-sm font-semibold text-neutral-800 mb-2">Fuel Status</div>
          <div class="bg-neutral-100 text-neutral-600 p-3 rounded-lg text-center text-xs italic">
            Fuel status not reported yet
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
    // Return the string value of the enum
    return GasStationBrand[brand as keyof typeof GasStationBrand] || brand.toString(); 
  }

  getBrandInitial(brand: GasStationBrand | null): string {
    const name = this.getBrandName(brand);
    return name ? name.charAt(0).toUpperCase() : '?';
  }
}