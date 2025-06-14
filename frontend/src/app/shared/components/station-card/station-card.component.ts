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
              <h3 class="font-extrabold text-xl leading-tight">{{station.name || 'Loading...'}}</h3>
              <p class="text-sm text-primary-100">{{getBrandName(station.brand) || (station.source === 'google' ? 'Google Sourced' : 'Brand N/A')}}</p>
              <p *ngIf="station.distance !== null && station.distance !== undefined" class="text-sm text-primary-200">{{station.distance.toFixed(1)}} km away</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Content -->
      <div class="p-4 space-y-4">
        <!-- Address -->
        <div class="flex items-start gap-2 text-sm text-neutral-700">
          <span class="mt-0.5 w-3.5 h-3.5 text-primary-600 flex-shrink-0">📍</span>
          <p>{{station.address || (station.source === 'google' && !(isLoadingDetails$ | async) ? 'Address not yet loaded' : 'Address not available')}}</p>
        </div>
        
        <!-- Fuel Status (from station.fuelStatus or station.rawFuelPrices as fallback) -->
        <div *ngIf="station.fuelStatus || station.rawFuelPrices">
          <div class="text-sm font-semibold text-neutral-800 mb-2">Fuel Status</div>
          <div class="space-y-1.5 text-xs">
          <ng-container *ngIf="station.fuelStatus as fs">
            <div *ngIf="fs.petrol !== undefined" class="flex items-center justify-between">
              <span class="font-medium text-neutral-700">Petrol</span>
              <div [ngClass]="{ 'badge-success': fs.petrol.available, 'badge-error': !fs.petrol.available, 'badge badge-sm': true }">
                <span *ngIf="fs.petrol.available">₦{{fs.petrol.price}}<span *ngIf="fs.petrol.queueLength" class="ml-1 opacity-75"> ({{fs.petrol.queueLength}})</span></span>
                <span *ngIf="!fs.petrol.available">Unavailable</span>
              </div>
            </div>
            <div *ngIf="fs.petrol === undefined && station.rawFuelPrices?.petrol !== undefined" class="flex items-center justify-between text-neutral-500">
              <span class="font-medium text-neutral-700">Petrol (est.)</span>
              <span>{{ station.rawFuelPrices?.petrol ? ('₦' + station.rawFuelPrices!.petrol) : 'N/A'}}</span>
          </div>

            <!-- Diesel -->
            <div *ngIf="fs.diesel !== undefined" class="flex items-center justify-between">
              <span class="font-medium text-neutral-700">Diesel</span>
              <div [ngClass]="{ 'badge-success': fs.diesel.available, 'badge-error': !fs.diesel.available, 'badge badge-sm': true }">
                <span *ngIf="fs.diesel.available">₦{{fs.diesel.price}}</span>
                <span *ngIf="!fs.diesel.available">Unavailable</span>
              </div>
            </div>
            <div *ngIf="fs.diesel === undefined && station.rawFuelPrices?.diesel !== undefined" class="flex items-center justify-between text-neutral-500">
              <span class="font-medium text-neutral-700">Diesel (est.)</span>
              <span>{{ station.rawFuelPrices?.diesel ? ('₦' + station.rawFuelPrices!.diesel) : 'N/A'}}</span>
          </div>

          </ng-container>
          <ng-container *ngIf="!station.fuelStatus && station.rawFuelPrices as rfp"> 
            <!-- Fallback to rawFuelPrices if fuelStatus is completely null -->
            <p class="text-neutral-500 text-xs mb-1">(Estimated prices based on brand)</p>
            <div *ngIf="rfp.petrol !== undefined && rfp.petrol !== null" class="flex items-center justify-between text-neutral-500">
              <span class="font-medium text-neutral-700">Petrol (est.)</span>
              <span>₦{{rfp.petrol}}</span>
            </div>
            <div *ngIf="rfp.diesel !== undefined && rfp.diesel !== null" class="flex items-center justify-between text-neutral-500">
              <span class="font-medium text-neutral-700">Diesel (est.)</span>
              <span>₦{{rfp.diesel}}</span>
            </div>
            <div *ngIf="rfp.kerosene !== undefined && rfp.kerosene !== null" class="flex items-center justify-between text-neutral-500">
              <span class="font-medium text-neutral-700">Kerosene (est.)</span>
              <span>₦{{rfp.kerosene}}</span>
            </div>
            <div *ngIf="rfp.gas !== undefined && rfp.gas !== null" class="flex items-center justify-between text-neutral-500">
              <span class="font-medium text-neutral-700">Gas (est.)</span>
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
            <span class="w-4 h-4 text-neutral-500">🕒</span>
            <span>{{getTimeAgo(station.lastReported)}}</span>
          </div>
          
          <div *ngIf="station.reliabilityScore !== null" class="flex items-center gap-1">
            <span class="w-4 h-4 text-yellow-500">⭐</span>
            <span class="text-sm font-medium text-neutral-600">
              {{station.reliabilityScore.toFixed(1)}}
            </span>
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