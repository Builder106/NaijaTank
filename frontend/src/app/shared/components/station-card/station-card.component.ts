import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Station, FuelStatus } from '../../../core/models/station.model';
import { StationService } from '../../../core/services/station.service';
import { GasStationBrand } from '@shared/enums';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store';
import * as StationSelectors from '../../../store/selectors/station.selectors';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card card-hover cursor-pointer relative rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg"
         [class.dark]="isDarkMode"
         (click)="onCardClick()"
         (touchstart)="onTouchStart($event)"
         (touchmove)="onTouchMove($event)"
         (touchend)="onTouchEnd($event)">
      
      <!-- Swipe Action Indicators -->
      <div class="absolute inset-0 flex items-center justify-between pointer-events-none z-5"
           [style.transform]="'translateX(' + swipeOffset + 'px)'"
           [style.opacity]="Math.abs(swipeOffset) > 50 ? 1 : 0">
        <!-- Left Swipe - Report -->
        <div class="bg-primary-500 text-white p-4 rounded-r-lg flex items-center gap-2"
             [style.opacity]="swipeOffset < -50 ? 1 : 0">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
          </svg>
          <span class="text-sm font-medium">Report</span>
        </div>
        <!-- Right Swipe - Favorite -->
        <div class="bg-yellow-500 text-white p-4 rounded-l-lg flex items-center gap-2"
             [style.opacity]="swipeOffset > 50 ? 1 : 0">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
          <span class="text-sm font-medium">Favorite</span>
        </div>
      </div>

      <!-- Loading/Linking Overlay -->
      <div *ngIf="(isLoadingDetails$ | async) || (isLinking$ | async)" 
           class="absolute inset-0 bg-white dark:bg-neutral-800 bg-opacity-90 dark:bg-opacity-90 flex items-center justify-center z-10">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
        <span class="ml-2 text-sm text-primary-700 dark:text-primary-300">
          {{ (isLinking$ | async) ? 'Linking...' : 'Loading details...' }}
        </span>
      </div>

      <!-- Offline Indicator -->
      <div *ngIf="isOffline" class="absolute top-2 right-2 z-20">
        <div class="bg-warning-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          Offline
        </div>
      </div>

      <!-- Main Card Content -->
      <div [style.transform]="'translateX(' + swipeOffset + 'px)'" 
           class="transition-transform duration-200 ease-out">
        
        <!-- Header -->
        <div class="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 p-4 text-white flex items-start gap-3">
          <img *ngIf="station.logoUrl" 
               [src]="station.logoUrl" 
               [alt]="getBrandName(station.brand) + ' logo'" 
               class="h-12 w-12 object-contain rounded-sm bg-white p-0.5 flex-shrink-0">
          <div *ngIf="!station.logoUrl && station.brand" 
               class="h-12 w-12 rounded-sm bg-primary-400 dark:bg-primary-500 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
            {{ getBrandInitial(station.brand) }}
          </div>
          <div class="flex-grow min-w-0">
            <div class="flex justify-between items-start">
              <div class="min-w-0 flex-grow">
                <!-- Station Name with Skeleton -->
                <div *ngIf="!isLoading; else nameSkeleton">
                  <h3 class="font-bold text-xl leading-tight truncate" [title]="station.name">
                    {{station.name || 'Loading...'}}
                  </h3>
                </div>
                <ng-template #nameSkeleton>
                  <div class="h-6 bg-white bg-opacity-30 rounded animate-pulse mb-1"></div>
                </ng-template>
                
                <!-- Brand with Skeleton -->
                <div *ngIf="!isLoading; else brandSkeleton">
                  <p class="text-sm text-primary-100 truncate">
                    {{getBrandName(station.brand) || (station.source === 'google' ? 'Google Sourced' : 'Brand N/A')}}
                  </p>
                </div>
                <ng-template #brandSkeleton>
                  <div class="h-4 bg-white bg-opacity-20 rounded animate-pulse w-24"></div>
                </ng-template>
                
                <!-- Distance & Travel Time -->
                <div class="flex items-center gap-2 mt-1">
                  <p *ngIf="station.distance !== null && station.distance !== undefined" 
                     class="text-xs text-primary-200">
                    {{station.distance.toFixed(1)}} km away
                  </p>
                  <span *ngIf="estimatedTravelTime" 
                        class="text-xs bg-primary-400 dark:bg-primary-500 px-2 py-0.5 rounded-full">
                    ~{{estimatedTravelTime}} min
                  </span>
                </div>
                
                <!-- Reliability Score -->
                <div *ngIf="station.reliabilityScore !== null && station.reliabilityScore !== undefined" 
                     class="flex items-center gap-1 mt-1">
                  <div class="flex items-center">
                    <!-- Traffic Light Ring -->
                    <div class="w-4 h-4 rounded-full border-2 mr-1"
                         [ngClass]="getReliabilityRingColor(station.reliabilityScore)">
                    </div>
                    <svg class="w-3 h-3 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  </div>
                  <span class="text-xs text-primary-100">
                    {{station.reliabilityScore.toFixed(1)}} ({{station.reportCount || 0}})
                  </span>
                </div>
              </div>
              
              <!-- Quick Actions -->
              <div class="flex flex-col gap-1 ml-2">
                <button *ngIf="station.contact?.phone" 
                        (click)="onCallStation($event)"
                        class="p-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-colors"
                        [attr.aria-label]="'Call ' + station.name">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                  </svg>
                </button>
                <button (click)="onNavigateToStation($event)"
                        class="p-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-colors"
                        [attr.aria-label]="'Navigate to ' + station.name">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Content -->
        <div class="p-4 space-y-4 bg-white dark:bg-neutral-800">
          <!-- Address -->
          <div class="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <svg class="mt-0.5 w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
            </svg>
            <p class="flex-1 min-w-0">
              {{station.address || (station.source === 'google' && !(isLoadingDetails$ | async) ? 'Address not yet loaded' : 'Address not available')}}
            </p>
          </div>
          
          <!-- Fuel Status -->
          <div *ngIf="!isCompactMode && (station.fuelStatus || station.rawFuelPrices)">
            <div class="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-3">Fuel Status</div>
            <div class="space-y-2">
              <!-- Dynamic Fuel Items -->
              <div *ngFor="let fuelType of getVisibleFuelTypes()" class="fuel-item">
                <ng-container *ngIf="getFuelDisplayInfo(fuelType) as info">
                  <div class="flex items-center justify-between p-2 rounded-lg border border-neutral-200 dark:border-neutral-600 hover:border-neutral-300 dark:hover:border-neutral-500 transition-colors bg-neutral-50 dark:bg-neutral-700">
                    <div class="flex items-center gap-3">
                      <!-- Fuel Icon -->
                      <div class="w-8 h-8 rounded-full flex items-center justify-center" [ngClass]="getFuelIconColor(fuelType)">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path [attr.d]="getFuelIconPath(fuelType)"/>
                        </svg>
                      </div>
                      <!-- Fuel Name -->
                      <span class="font-medium text-sm text-neutral-700 dark:text-neutral-300">{{getFuelTypeName(fuelType)}}</span>
                      <!-- Estimated Label -->
                      <span *ngIf="info.type === 'estimated'" 
                            class="text-xs px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-600 text-neutral-600 dark:text-neutral-300 rounded">
                        est.
                      </span>
                    </div>
                    <!-- Status/Price -->
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-semibold" [ngClass]="info.statusClass">{{info.displayText}}</span>
                      <!-- Queue indicator for reported fuel -->
                      <span *ngIf="info.type === 'reported' && info.available && info.queueLength && info.queueLength !== 'None'" 
                            class="text-xs px-1.5 py-0.5 bg-warning-100 dark:bg-warning-900 text-warning-700 dark:text-warning-300 rounded-full">
                        {{info.queueLength}}
                      </span>
                    </div>
                  </div>
                </ng-container>
              </div>
              
              <!-- Show More Button -->
              <button *ngIf="hasMoreFuelTypes()" 
                      (click)="toggleFuelExpansion($event)"
                      class="w-full text-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 py-2">
                {{isExpanded ? 'Show Less' : '+' + getHiddenFuelCount() + ' more'}}
              </button>
            </div>
          </div>
          
          <!-- Compact Fuel Status -->
          <div *ngIf="isCompactMode && (station.fuelStatus || station.rawFuelPrices)" 
               class="flex items-center gap-2">
            <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Fuel:</span>
            <div class="flex gap-1">
              <span *ngFor="let fuelType of fuelTypesArray" 
                    class="w-3 h-3 rounded-full"
                    [ngClass]="getCompactFuelStatusColor(fuelType)"
                    [title]="getFuelTypeName(fuelType) + ': ' + getFuelDisplayInfo(fuelType).displayText">
              </span>
            </div>
          </div>
          
          <!-- No Fuel Status -->
          <div *ngIf="!station.fuelStatus && !station.rawFuelPrices">
            <div class="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2">Fuel Status</div>
            <div class="bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 p-4 rounded-lg text-center">
              <svg class="w-8 h-8 mx-auto mb-2 text-neutral-400 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.563M15 9.34c-1.44-1.122-3.08-1.34-5-1.34s-3.56.218-5 1.34"/>
              </svg>
              <p class="text-sm italic">No fuel status reported yet</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="pt-4 border-t border-neutral-200 dark:border-neutral-600 text-xs flex items-center justify-between">
            <div class="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
              <svg class="w-4 h-4 text-neutral-500 dark:text-neutral-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
              </svg>
              <span class="text-sm font-medium">Last report: {{getTimeAgo(station.lastReported)}}</span>
            </div>
            
            <!-- Quick Report Button -->
            <button (click)="onQuickReport($event)"
                    class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">
              Quick Report
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Inline Quick Report Form -->
    <div *ngIf="showQuickReport" 
         class="mt-2 p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg border border-neutral-200 dark:border-neutral-600 animate-in slide-in-from-top duration-200">
      <h4 class="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-3">Quick Fuel Report</h4>
      
      <div class="space-y-3">
        <!-- Fuel Type Selection -->
        <div class="flex gap-2 flex-wrap">
          <button *ngFor="let fuelType of fuelTypesArray"
                  (click)="selectedFuelType = fuelType"
                  [class.bg-primary-500]="selectedFuelType === fuelType"
                  [class.text-white]="selectedFuelType === fuelType"
                  [class.bg-neutral-200]="selectedFuelType !== fuelType"
                  [class.text-neutral-700]="selectedFuelType !== fuelType"
                  class="px-3 py-1 rounded-full text-xs font-medium transition-colors">
            {{getFuelTypeName(fuelType)}}
          </button>
        </div>
        
        <!-- Availability Toggle -->
        <div class="flex items-center gap-3">
          <span class="text-sm text-neutral-700 dark:text-neutral-300">Available:</span>
          <button (click)="quickReportAvailable = !quickReportAvailable"
                  [class.bg-success-500]="quickReportAvailable"
                  [class.bg-neutral-300]="!quickReportAvailable"
                  class="w-12 h-6 rounded-full relative transition-colors">
            <div class="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform"
                 [style.transform]="quickReportAvailable ? 'translateX(1.5rem)' : 'translateX(0.125rem)'">
            </div>
          </button>
        </div>
        
        <!-- Price Input -->
        <div *ngIf="quickReportAvailable" class="flex items-center gap-3">
          <span class="text-sm text-neutral-700 dark:text-neutral-300">Price:</span>
          <input type="number" 
                 [(ngModel)]="quickReportPrice"
                 placeholder="₦650"
                 class="flex-1 px-3 py-1 border border-neutral-300 dark:border-neutral-500 rounded text-sm bg-white dark:bg-neutral-600 text-neutral-900 dark:text-neutral-100">
        </div>
        
        <!-- Queue Length -->
        <div *ngIf="quickReportAvailable" class="flex items-center gap-3">
          <span class="text-sm text-neutral-700 dark:text-neutral-300">Queue:</span>
          <select [(ngModel)]="quickReportQueue" 
                  class="flex-1 px-3 py-1 border border-neutral-300 dark:border-neutral-500 rounded text-sm bg-white dark:bg-neutral-600 text-neutral-900 dark:text-neutral-100">
            <option value="None">None</option>
            <option value="Short">Short</option>
            <option value="Medium">Medium</option>
            <option value="Long">Long</option>
          </select>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex gap-2 pt-2">
          <button (click)="submitQuickReport()"
                  class="flex-1 bg-primary-500 text-white py-2 rounded text-sm font-medium hover:bg-primary-600 transition-colors">
            Submit Report
          </button>
          <button (click)="cancelQuickReport()"
                  class="px-4 py-2 border border-neutral-300 dark:border-neutral-500 text-neutral-700 dark:text-neutral-300 rounded text-sm hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  `
})
export class StationCardComponent implements OnInit, OnDestroy {
  @Input() station!: Station;
  @Input() isCompactMode = false;
  @Input() isDarkMode = false;
  @Input() isOffline = false;
  @Output() stationSelected = new EventEmitter<Station>();
  @Output() quickReportSubmitted = new EventEmitter<any>();
  @Output() favoriteToggled = new EventEmitter<Station>();

  isLoadingDetails$!: Observable<boolean>;
  isLinking$!: Observable<boolean>;
  
  // Define fuel types in display order
  fuelTypesArray: Array<'petrol' | 'diesel' | 'kerosene' | 'gas'> = ['petrol', 'diesel', 'kerosene', 'gas'];
  
  // Component state
  isLoading = false;
  isExpanded = false;
  estimatedTravelTime: number | null = null;
  
  // Touch/Swipe handling
  private touchStartX = 0;
  private touchStartY = 0;
  private isSwiping = false;
  swipeOffset = 0;
  
  // Quick report state
  showQuickReport = false;
  selectedFuelType: 'petrol' | 'diesel' | 'kerosene' | 'gas' = 'petrol';
  quickReportAvailable = true;
  quickReportPrice: number | null = null;
  quickReportQueue = 'None';
  
  private destroy$ = new Subject<void>();
  
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
    
    // Calculate estimated travel time
    this.calculateTravelTime();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    // Handle responsive changes
    this.isCompactMode = event.target.innerWidth < 768;
  }

  // Touch/Swipe handlers
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.isSwiping = false;
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.touchStartX) return;
    
    const currentX = event.touches[0].clientX;
    const currentY = event.touches[0].clientY;
    const diffX = currentX - this.touchStartX;
    const diffY = currentY - this.touchStartY;
    
    // Only start swiping if horizontal movement is greater than vertical
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      this.isSwiping = true;
      this.swipeOffset = Math.max(-100, Math.min(100, diffX));
      event.preventDefault();
    }
  }

  onTouchEnd(event: TouchEvent): void {
    if (this.isSwiping) {
      if (this.swipeOffset < -50) {
        // Left swipe - Report
        this.onQuickReport(event);
      } else if (this.swipeOffset > 50) {
        // Right swipe - Favorite
        this.onToggleFavorite(event);
      }
    }
    
    // Reset swipe state
    this.swipeOffset = 0;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isSwiping = false;
  }

  onCardClick(): void {
    if (!this.isSwiping && !this.showQuickReport) {
      this.stationSelected.emit(this.station);
    }
  }

  onCallStation(event: Event): void {
    event.stopPropagation();
    if (this.station.contact?.phone) {
      window.open(`tel:${this.station.contact.phone}`, '_self');
    }
  }

  onNavigateToStation(event: Event): void {
    event.stopPropagation();
    const url = `https://www.google.com/maps/dir/?api=1&destination=${this.station.latitude},${this.station.longitude}`;
    window.open(url, '_blank');
  }

  onQuickReport(event: Event): void {
    event.stopPropagation();
    this.showQuickReport = !this.showQuickReport;
  }

  onToggleFavorite(event: Event): void {
    event.stopPropagation();
    this.favoriteToggled.emit(this.station);
  }

  submitQuickReport(): void {
    const report = {
      stationId: this.station.id,
      fuelType: this.selectedFuelType,
      available: this.quickReportAvailable,
      price: this.quickReportAvailable ? this.quickReportPrice : null,
      queueLength: this.quickReportAvailable ? this.quickReportQueue : null
    };
    
    this.quickReportSubmitted.emit(report);
    this.cancelQuickReport();
  }

  cancelQuickReport(): void {
    this.showQuickReport = false;
    this.quickReportPrice = null;
    this.quickReportQueue = 'None';
    this.quickReportAvailable = true;
  }

  toggleFuelExpansion(event: Event): void {
    event.stopPropagation();
    this.isExpanded = !this.isExpanded;
  }

  getVisibleFuelTypes(): Array<'petrol' | 'diesel' | 'kerosene' | 'gas'> {
    if (this.isExpanded || this.isCompactMode) {
      return this.fuelTypesArray;
    }
    return this.fuelTypesArray.slice(0, 2); // Show only first 2 by default
  }

  hasMoreFuelTypes(): boolean {
    return !this.isCompactMode && this.fuelTypesArray.length > 2;
  }

  getHiddenFuelCount(): number {
    return this.fuelTypesArray.length - 2;
  }

  calculateTravelTime(): void {
    if (this.station.distance) {
      // Rough estimate: 30 km/h average speed in city
      this.estimatedTravelTime = Math.round((this.station.distance / 30) * 60);
    }
  }

  getReliabilityRingColor(score: number): string {
    if (score >= 4) return 'border-success-500'; // Green
    if (score >= 3) return 'border-warning-500'; // Yellow
    return 'border-error-500'; // Red
  }

  getCompactFuelStatusColor(fuelType: 'petrol' | 'diesel' | 'kerosene' | 'gas'): string {
    const info = this.getFuelDisplayInfo(fuelType);
    if (info.type === 'reported') {
      return info.available ? 'bg-success-500' : 'bg-error-500';
    } else if (info.type === 'estimated') {
      return 'bg-warning-500';
    }
    return 'bg-neutral-300 dark:bg-neutral-600';
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
          statusClass: 'text-success-600 dark:text-success-400'
        };
      } else {
        return {
          type: 'reported',
          available: false,
          displayText: 'Unavailable',
          statusClass: 'text-error-600 dark:text-error-400'
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
        statusClass: 'text-neutral-600 dark:text-neutral-400'
      };
    }

    // No data available
    return {
      type: 'none',
      displayText: 'N/A',
      statusClass: 'text-neutral-400 dark:text-neutral-500'
    };
  }

  getFuelIconPath(fuelType: string): string {
    const icons = {
      // Gas Pump icon (fa-gas-pump style)
      petrol: 'M2 2a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V2zm2 0v12h8V2H4zm10 2h1a1 1 0 011 1v2a1 1 0 01-1 1h-1V4zm0 6h1a1 1 0 011 1v2a1 1 0 01-1 1h-1v-4zm-8-4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H7a1 1 0 01-1-1V6z',
      // Oil Can icon (fa-oil-can style)  
      diesel: 'M2 10a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zm2-6a1 1 0 011-1h6a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm12 4a1 1 0 011 1v2a1 1 0 01-1 1h-2V8h2zM6 10h4v2H6v-2z',
      // Lamp icon (fa-lamp style)
      kerosene: 'M8 2a1 1 0 011 1v1h2a1 1 0 110 2H9v1a3 3 0 003 3h1a1 1 0 110 2h-1a5 5 0 01-5-5V6H5a1 1 0 110-2h2V3a1 1 0 011-1zm2 8a1 1 0 100 2 1 1 0 000-2z',
      // Flame icon (fa-burn/fa-flame style)
      gas: 'M10 2C8.5 2 7.5 3.5 7.5 5c0 1 .5 2 1 2.5.5.5 1 1 1 2 0 .5-.5 1-1 1.5-.5.5-1 1-1 2 0 1.5 1 2.5 2.5 2.5s2.5-1 2.5-2.5c0-1-.5-1.5-1-2-.5-.5-1-1-1-2 0-.5.5-1 1-1.5.5-.5 1-1.5 1-2.5 0-1.5-1-3-2.5-3z'
    };
    return icons[fuelType as keyof typeof icons] || icons.petrol;
  }

  getFuelIconColor(fuelType: string): string {
    const colors = {
      petrol: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
      diesel: 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400', 
      kerosene: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
      gas: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
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