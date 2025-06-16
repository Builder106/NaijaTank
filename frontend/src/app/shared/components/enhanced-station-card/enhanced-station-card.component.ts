import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Station } from '../../../core/models/station.model';
import { StationIntelligenceService } from '../../../core/services/station-intelligence.service';
import { OfflineQueueService } from '../../../core/services/offline-queue.service';
import { DataFreshnessIndicatorComponent } from '../data-freshness-indicator/data-freshness-indicator.component';
import { PriceTrendIndicatorComponent } from '../price-trend-indicator/price-trend-indicator.component';
import { MiniSparklineComponent } from '../mini-sparkline/mini-sparkline.component';
import { CommunityBadgeComponent } from '../community-badge/community-badge.component';
import { AvailabilityPredictionComponent } from '../availability-prediction/availability-prediction.component';
import { PeakHoursIndicatorComponent } from '../peak-hours-indicator/peak-hours-indicator.component';

@Component({
  selector: 'app-enhanced-station-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DataFreshnessIndicatorComponent,
    PriceTrendIndicatorComponent,
    MiniSparklineComponent,
    CommunityBadgeComponent,
    AvailabilityPredictionComponent,
    PeakHoursIndicatorComponent
  ],
  template: `
    <div class="enhanced-station-card bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
         [class.offline-mode]="!(isOnline$ | async)">
      
      <!-- Offline Indicator -->
      <div *ngIf="!(isOnline$ | async)" class="bg-orange-100 dark:bg-orange-900/20 px-4 py-2 border-b border-orange-200 dark:border-orange-800">
        <div class="flex items-center space-x-2 text-orange-800 dark:text-orange-200 text-xs">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-12.728 12.728m0 0L5.636 5.636m0 12.728L18.364 5.636"/>
          </svg>
          <span>Offline - showing cached data</span>
        </div>
      </div>

      <!-- Station Header -->
      <div class="p-4 pb-3">
        <div class="flex items-start justify-between mb-2">
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2 mb-1">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate">{{ enhancedStation.name }}</h3>
              <div *ngIf="enhancedStation.confidenceScore" 
                   class="px-2 py-1 rounded-full text-xs font-medium"
                   [class]="getConfidenceScoreClass(enhancedStation.confidenceScore)"
                   [title]="'Data confidence: ' + enhancedStation.confidenceScore + '%'">
                {{ enhancedStation.confidenceScore }}%
              </div>
            </div>
            
            <p class="text-sm text-gray-600 dark:text-gray-400 truncate">{{ enhancedStation.address }}</p>
            
            <!-- Enhanced metadata row -->
            <div class="flex items-center space-x-3 mt-1 text-xs">
              <!-- Data freshness for each fuel type -->
              <div *ngFor="let fuelType of fuelTypes" class="flex items-center space-x-1">
                <span class="text-gray-500">{{ getFuelTypeName(fuelType) }}:</span>
                <app-data-freshness-indicator 
                  *ngIf="getFuelDataFreshness(fuelType)"
                  [freshness]="getFuelDataFreshness(fuelType)!">
                </app-data-freshness-indicator>
              </div>
            </div>
          </div>
          
          <!-- Enhanced Favorite Button -->
          <button 
            (click)="onToggleFavorite()"
            class="favorite-button p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            [class.animate-bounce]="favoriteAnimating"
            [attr.aria-label]="enhancedStation.isFavorite ? 'Remove from favorites' : 'Add to favorites'">
            <svg class="w-5 h-5 transition-all duration-200" 
                 [class]="enhancedStation.isFavorite ? 'text-yellow-500 scale-110' : 'text-gray-400 hover:text-gray-600'" 
                 fill="currentColor" 
                 viewBox="0 0 20 20">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
            </svg>
          </button>
        </div>

        <!-- Distance, Travel Time, and Peak Hours -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-2" *ngIf="enhancedStation.distance">
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ enhancedStation.distance.toFixed(1) }}km away • {{ estimatedTravelTime }}min
            </span>
          </div>
          
          <app-peak-hours-indicator 
            *ngIf="enhancedStation.peakHours"
            [peakHours]="enhancedStation.peakHours">
          </app-peak-hours-indicator>
        </div>

        <!-- Community Data -->
        <app-community-badge 
          *ngIf="enhancedStation.communityData"
          [communityData]="enhancedStation.communityData"
          class="mb-3">
        </app-community-badge>
      </div>

      <!-- Enhanced Fuel Status Grid -->
      <div class="px-4 pb-3">
        <div class="grid grid-cols-2 gap-2">
          <div *ngFor="let fuelType of fuelTypes"
               class="fuel-pill flex items-center space-x-2 p-2 rounded-md transition-all duration-200 hover:bg-opacity-80 hover:transform hover:scale-105 focus-within:ring-2 focus-within:ring-primary-500"
               [class]="getFuelPillClass(fuelType)">
            
            <div [class]="getFuelIconColor(fuelType)" class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path [attr.d]="getFuelIconPath(fuelType)"/>
              </svg>
            </div>
            
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <p class="text-xs font-medium text-gray-900 dark:text-white truncate">{{ getFuelTypeName(fuelType) }}</p>
                <app-price-trend-indicator 
                  *ngIf="getFuelPriceTrend(fuelType)"
                  [trend]="getFuelPriceTrend(fuelType)!">
                </app-price-trend-indicator>
              </div>
              
              <p class="text-xs truncate" [class]="getFuelDisplayInfo(fuelType).statusClass">
                {{ getFuelDisplayInfo(fuelType).displayText }}
              </p>
              
              <!-- Enhanced sparkline with real trend data -->
              <div class="mt-1">
                <app-mini-sparkline 
                  *ngIf="getFuelSparklineData(fuelType).length > 0"
                  [data]="getFuelSparklineData(fuelType)"
                  [width]="24"
                  [height]="4"
                  [color]="getSparklineColor(fuelType)">
                </app-mini-sparkline>
              </div>
            </div>
          </div>
        </div>

        <!-- Availability Predictions -->
        <div class="mt-3 space-y-2">
          <app-availability-prediction 
            *ngFor="let fuelType of fuelTypes"
            [prediction]="getFuelAvailabilityPrediction(fuelType)"
            class="block">
          </app-availability-prediction>
        </div>
      </div>

      <!-- Enhanced Queue Status -->
      <div class="px-4 pb-3" *ngIf="getOverallQueueStatus()">
        <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
          <span>Queue Status</span>
          <span class="flex items-center space-x-1">
            <div class="w-2 h-2 rounded-full animate-pulse" [class]="getQueuePulseClass()"></div>
            <span>{{ getQueueTimeEstimate() }}</span>
          </span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
          <div class="h-2 rounded-full transition-all duration-500" 
               [class]="getQueueBarClass()"
               [style.width]="getQueueBarWidth()"></div>
        </div>
      </div>

      <!-- Alternative Stations -->
      <div *ngIf="enhancedStation.alternativeStations && enhancedStation.alternativeStations.length > 0" 
           class="px-4 pb-3">
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Alternatives nearby:</p>
        <div class="space-y-1">
          <div *ngFor="let alt of enhancedStation.alternativeStations" 
               class="flex items-center justify-between text-xs p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <span class="truncate">{{ alt.name }}</span>
            <span class="text-gray-500 ml-2">{{ alt.distance.toFixed(1) }}km • Save {{ alt.estimatedSavings }}min</span>
          </div>
        </div>
      </div>

      <!-- Enhanced Action Buttons -->
      <div class="p-4 pt-0">
        <div class="flex space-x-2">
          <button 
            (click)="onViewDetails()"
            class="action-button flex-1 bg-primary-500 hover:bg-primary-600 active:scale-98 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 hover:shadow-lg">
            <span class="flex items-center justify-center space-x-1">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              <span>View Details</span>
            </span>
          </button>
          
          <button 
            (click)="onReportFuel()"
            class="action-button flex-1 bg-gray-600 hover:bg-gray-700 active:scale-98 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 hover:shadow-lg">
            <span class="flex items-center justify-center space-x-1">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              <span>Report</span>
            </span>
          </button>
        </div>
        
        <!-- Success feedback for offline actions -->
        <div *ngIf="showOfflineSuccess" 
             class="mt-2 p-2 bg-green-100 dark:bg-green-900/20 rounded text-xs text-green-800 dark:text-green-200 text-center">
          Action queued for when you're back online
        </div>
      </div>
    </div>
  `,
  styles: [`
    .enhanced-station-card {
      border-radius: 8px;
      position: relative;
    }

    .enhanced-station-card.offline-mode {
      opacity: 0.9;
      border: 1px solid #f59e0b;
    }

    .favorite-button:active {
      transform: scale(0.95);
    }

    .fuel-pill:hover {
      transform: translateY(-1px) scale(1.02);
    }

    .action-button:hover {
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .action-button:active {
      transform: scale(0.98);
    }

    .animate-bounce {
      animation: bounce 0.5s ease-in-out;
    }

    @keyframes bounce {
      0%, 20%, 53%, 80%, 100% {
        transform: translate3d(0,0,0);
      }
      40%, 43% {
        transform: translate3d(0,-8px,0);
      }
      70% {
        transform: translate3d(0,-4px,0);
      }
      90% {
        transform: translate3d(0,-2px,0);
      }
    }

    /* Enhanced focus styles */
    .fuel-pill:focus-within {
      outline: 2px solid var(--color-primary-500);
      outline-offset: 2px;
    }

    /* Breathing animation for queue bar */
    .queue-breathing {
      animation: breathe 2s ease-in-out infinite;
    }

    @keyframes breathe {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  `]
})
export class EnhancedStationCardComponent implements OnInit {
  @Input() station!: Station;
  @Output() toggleFavorite = new EventEmitter<string>();
  @Output() viewDetails = new EventEmitter<Station>();
  @Output() reportFuel = new EventEmitter<string>();

  enhancedStation!: Station;
  estimatedTravelTime?: number;
  favoriteAnimating = false;
  showOfflineSuccess = false;
  isOnline$ = this.offlineQueue.isOnline$;
  
  public fuelTypes: Array<'petrol' | 'diesel' | 'kerosene' | 'gas'> = ['petrol', 'diesel', 'kerosene', 'gas'];

  constructor(
    private intelligenceService: StationIntelligenceService,
    private offlineQueue: OfflineQueueService
  ) {}

  ngOnInit(): void {
    this.enhanceStationData();
    this.calculateTravelTime();
  }

  private enhanceStationData(): void {
    this.enhancedStation = { ...this.station };
    
    // Add intelligence data
    this.enhancedStation.peakHours = this.intelligenceService.analyzePeakHours();
    this.enhancedStation.communityData = this.intelligenceService.generateCommunityData(this.station.id);
    this.enhancedStation.confidenceScore = this.intelligenceService.calculateConfidenceScore(this.station);
    
    // Enhance fuel status with intelligence
    if (this.enhancedStation.fuelStatus) {
      Object.keys(this.enhancedStation.fuelStatus).forEach(fuelType => {
        const fuel = this.enhancedStation.fuelStatus![fuelType as keyof typeof this.enhancedStation.fuelStatus];
        if (fuel && fuel.lastUpdated) {
          fuel.dataFreshness = this.intelligenceService.calculateDataFreshness(fuel.lastUpdated);
          
          if (fuel.price) {
            fuel.priceTrend = this.intelligenceService.generatePriceTrend(fuel.price, fuelType);
          }
          
          fuel.availabilityPrediction = this.intelligenceService.predictAvailability(this.station, fuelType);
        }
      });
    }
  }

  onToggleFavorite(): void {
    this.favoriteAnimating = true;
    setTimeout(() => this.favoriteAnimating = false, 500);
    
    if (navigator.onLine) {
      this.toggleFavorite.emit(this.station.id);
    } else {
      this.offlineQueue.queueAction('favorite_toggle', { stationId: this.station.id });
      this.showOfflineSuccessMessage();
    }
  }

  onViewDetails(): void {
    this.intelligenceService.updateUserPreferences('selected_station', { reason: 'details' });
    this.viewDetails.emit(this.enhancedStation);
  }

  onReportFuel(): void {
    if (navigator.onLine) {
      this.reportFuel.emit(this.station.id);
    } else {
      this.offlineQueue.queueAction('fuel_report', { stationId: this.station.id });
      this.showOfflineSuccessMessage();
    }
  }

  private showOfflineSuccessMessage(): void {
    this.showOfflineSuccess = true;
    setTimeout(() => this.showOfflineSuccess = false, 3000);
  }

  // Enhanced data access methods
  getFuelDataFreshness(fuelType: string) {
    return this.enhancedStation.fuelStatus?.[fuelType as keyof typeof this.enhancedStation.fuelStatus]?.dataFreshness;
  }

  getFuelPriceTrend(fuelType: string) {
    return this.enhancedStation.fuelStatus?.[fuelType as keyof typeof this.enhancedStation.fuelStatus]?.priceTrend;
  }

  getFuelAvailabilityPrediction(fuelType: string) {
    return this.enhancedStation.fuelStatus?.[fuelType as keyof typeof this.enhancedStation.fuelStatus]?.availabilityPrediction || {
      likelyToRunOut: false,
      estimatedTime: null,
      confidence: 0
    };
  }

  getFuelSparklineData(fuelType: string): number[] {
    const trend = this.getFuelPriceTrend(fuelType);
    return trend?.sparklineData || [];
  }

  getSparklineColor(fuelType: string): string {
    const trend = this.getFuelPriceTrend(fuelType);
    if (!trend) return '#10B981';
    
    switch (trend.direction) {
      case 'up': return '#EF4444';
      case 'down': return '#10B981';
      default: return '#6B7280';
    }
  }

  getConfidenceScoreClass(score: number): string {
    if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
  }

  getQueuePulseClass(): string {
    const maxQueue = this.getMaxQueueLevel();
    const classes = ['bg-green-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500'];
    return classes[maxQueue] || 'bg-green-500';
  }

  private getMaxQueueLevel(): number {
    let maxQueue = 0;
    this.fuelTypes.forEach(fuelType => {
      const status = this.enhancedStation.fuelStatus?.[fuelType];
      if (status?.queueLength) {
        switch (status.queueLength) {
          case 'Short': maxQueue = Math.max(maxQueue, 1); break;
          case 'Medium': maxQueue = Math.max(maxQueue, 2); break;
          case 'Long': maxQueue = Math.max(maxQueue, 3); break;
        }
      }
    });
    return maxQueue;
  }

  // Existing methods from original component
  getFuelPillClass(fuelType: 'petrol' | 'diesel' | 'kerosene' | 'gas'): string {
    const info = this.getFuelDisplayInfo(fuelType);
    if (info.type === 'none') return 'bg-gray-100 dark:bg-gray-700';
    return info.available ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20';
  }

  getFuelDisplayInfo(fuelType: 'petrol' | 'diesel' | 'kerosene' | 'gas') {
    const status = this.enhancedStation.fuelStatus?.[fuelType];
    const rawPrice = this.enhancedStation.rawFuelPrices?.[fuelType];

    if (status) {
      return {
        type: 'reported',
        available: status.available,
        price: status.price ?? undefined,
        displayText: status.available ?
          (status.price ? `₦${status.price}` : 'Available') :
          'Unavailable',
        statusClass: status.available ?
          'text-green-700 dark:text-green-300 font-medium' :
          'text-red-700 dark:text-red-300 font-medium'
      };
    } else if (rawPrice) {
      return {
        type: 'estimated',
        available: true,
        price: rawPrice,
        displayText: `₦${rawPrice}`,
        statusClass: 'text-gray-600 dark:text-gray-400'
      };
    }

    return {
      type: 'none',
      displayText: 'No data',
      statusClass: 'text-gray-500 dark:text-gray-400'
    };
  }

  getFuelTypeName(fuelType: string): string {
    const names: Record<string, string> = {
      petrol: 'Petrol',
      diesel: 'Diesel', 
      kerosene: 'Kerosene',
      gas: 'Gas'
    };
    return names[fuelType];
  }

  getFuelIconColor(fuelType: string): string {
    const colors: Record<string, string> = {
      petrol: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
      diesel: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
      kerosene: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300',
      gas: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300'
    };
    return colors[fuelType];
  }

  getFuelIconPath(fuelType: string): string {
    const paths: Record<string, string> = {
      petrol: 'M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zm14 3H2v11a2 2 0 002 2h12a2 2 0 002-2V7zM6 9a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z',
      diesel: 'M2 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm10 3H4V5h8v2zm0 3H4V8h8v2zm-8 3h8v2H4v-2z',
      kerosene: 'M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z',
      gas: 'M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8.333L14 10V6a2 2 0 00-2-2H4zm3 5a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z'
    };
    return paths[fuelType];
  }

  getOverallQueueStatus(): boolean {
    return this.fuelTypes.some(fuelType => {
      const status = this.enhancedStation.fuelStatus?.[fuelType];
      return status?.queueLength && status.queueLength !== 'None';
    });
  }

  getQueueTimeEstimate(): string {
    const maxQueue = this.getMaxQueueLevel();
    const timeEstimates = ['0 min', '5 min', '15 min', '30+ min'];
    return timeEstimates[maxQueue] || '0 min';
  }

  getQueueBarWidth(): string {
    const maxQueue = this.getMaxQueueLevel();
    const widths = ['0%', '25%', '60%', '90%'];
    return widths[maxQueue] || '0%';
  }

  getQueueBarClass(): string {
    const maxQueue = this.getMaxQueueLevel();
    const classes = ['bg-green-500', 'bg-green-500 queue-breathing', 'bg-yellow-500 queue-breathing', 'bg-red-500 queue-breathing'];
    return classes[maxQueue] || 'bg-green-500';
  }

  private calculateTravelTime(): void {
    if (this.enhancedStation.distance) {
      this.estimatedTravelTime = Math.round(this.enhancedStation.distance * 1.5);
    }
  }
}