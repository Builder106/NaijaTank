import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Station, FuelStatus } from '../../../core/models/station.model';
import { GasStationBrand } from '../../../../../shared/enums';

interface FuelDisplayInfo {
  type: 'reported' | 'estimated' | 'none';
  available?: boolean;
  price?: number;
  queueLength?: number;
  displayText: string;
  statusClass: string;
  trend?: 'up' | 'down' | 'stable'; // For future sparkline implementation
}

@Component({
  selector: 'app-station-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="station-card bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
      <!-- Station Header -->
      <div class="p-4 pb-3">
        <div class="flex items-start justify-between mb-2">
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate">{{ station.name }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 truncate">{{ station.address }}</p>
            <!-- Last updated moved directly under address -->
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Updated {{ getTimeAgo(station.lastReported) }}
            </p>
          </div>
          
          <!-- Favorite Button with Animation -->
          <button 
            (click)="onToggleFavorite()"
            class="favorite-button p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            [attr.aria-label]="station.isFavorite ? 'Remove from favorites' : 'Add to favorites'">
            <svg class="w-5 h-5 transition-all duration-200" 
                 [class]="station.isFavorite ? 'text-yellow-500 scale-110' : 'text-gray-400 hover:text-gray-600'" 
                 fill="currentColor" 
                 viewBox="0 0 20 20">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
            </svg>
          </button>
        </div>

        <!-- Distance and Travel Time -->
        <div class="flex items-center space-x-2 mb-3" *ngIf="station.distance">
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ station.distance.toFixed(1) }}km away
          </span>
          <span *ngIf="estimatedTravelTime" class="text-xs text-gray-500 dark:text-gray-400">
            • {{ estimatedTravelTime }}min
          </span>
        </div>
      </div>

      <!-- Fuel Status Grid -->
      <div class="px-4 pb-3">
        <div class="grid grid-cols-2 gap-2">
          <div *ngFor="let fuelType of fuelTypes"
               class="fuel-pill flex items-center space-x-2 p-2 rounded-md transition-all duration-200 hover:bg-opacity-80 focus-within:ring-2 focus-within:ring-primary-500"
               [class]="getFuelPillClass(fuelType)">
            <div [class]="getFuelIconColor(fuelType)" class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path [attr.d]="getFuelIconPath(fuelType)"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-gray-900 dark:text-white truncate">{{ getFuelTypeName(fuelType) }}</p>
              <p class="text-xs truncate" [class]="getFuelDisplayInfo(fuelType).statusClass">
                {{ getFuelDisplayInfo(fuelType).displayText }}
              </p>
              <!-- Mini sparkline placeholder for future implementation -->
              <div class="mt-1 h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div class="h-full bg-green-400 rounded-full transition-all duration-300" 
                     [style.width]="getTrendWidth(fuelType)"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Queue Status Bar -->
      <div class="px-4 pb-3" *ngIf="getOverallQueueStatus()">
        <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
          <span>Queue Status</span>
          <span>{{ getQueueTimeEstimate() }}</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
          <div class="h-2 rounded-full transition-all duration-300" 
               [class]="getQueueBarClass()"
               [style.width]="getQueueBarWidth()"></div>
        </div>
      </div>

      <!-- Reliability Score -->
      <div class="px-4 pb-4" *ngIf="station.reliabilityScore">
        <div class="flex items-center space-x-2">
          <div class="w-4 h-4 rounded-full border-2 flex-shrink-0" [class]="getReliabilityRingColor(station.reliabilityScore)">
            <div class="w-full h-full rounded-full bg-current opacity-20"></div>
          </div>
          <span class="text-xs text-gray-600 dark:text-gray-400">
            Reliability: {{ station.reliabilityScore.toFixed(1) }}/5
            <span *ngIf="station.reportCount" class="ml-1">({{ station.reportCount }} reports)</span>
          </span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="p-4 pt-0">
        <div class="flex space-x-2">
          <button 
            (click)="onViewDetails()"
            class="action-button flex-1 bg-primary-500 hover:bg-primary-600 active:scale-98 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
            View Details
          </button>
          <button 
            (click)="onReportFuel()"
            class="action-button flex-1 bg-gray-600 hover:bg-gray-700 active:scale-98 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
            Report Fuel
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .station-card {
      border-radius: 8px;
    }

    .favorite-button:active {
      transform: scale(0.95);
    }

    .favorite-button:active svg {
      transform: scale(1.2);
    }

    .fuel-pill:hover {
      transform: translateY(-1px);
    }

    .action-button:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .action-button:active {
      transform: scale(0.98);
    }

    .scale-98 {
      transform: scale(0.98);
    }

    /* Focus styles for accessibility */
    .fuel-pill:focus-within {
      outline: 2px solid var(--color-primary-500);
      outline-offset: 2px;
    }

    /* Ensure proper contrast for accessibility */
    .fuel-pill .text-gray-600 {
      color: #4B5563;
    }

    .dark .fuel-pill .text-gray-400 {
      color: #9CA3AF;
    }
  `]
})
export class StationCardComponent implements OnInit {
  @Input() station!: Station;
  @Output() toggleFavorite = new EventEmitter<string>();
  @Output() viewDetails = new EventEmitter<Station>();
  @Output() reportFuel = new EventEmitter<string>();

  estimatedTravelTime?: number;
  public fuelTypes: Array<'petrol' | 'diesel' | 'kerosene' | 'gas'> = ['petrol', 'diesel', 'kerosene', 'gas'];

  ngOnInit(): void {
    this.calculateTravelTime();
  }

  onToggleFavorite(): void {
    this.toggleFavorite.emit(this.station.id);
  }

  onViewDetails(): void {
    this.viewDetails.emit(this.station);
  }

  onReportFuel(): void {
    this.reportFuel.emit(this.station.id);
  }

  getFuelPillClass(fuelType: 'petrol' | 'diesel' | 'kerosene' | 'gas'): string {
    const info = this.getFuelDisplayInfo(fuelType);
    if (info.type === 'none') return 'bg-gray-100 dark:bg-gray-700';
    return info.available ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20';
  }

  getFuelDisplayInfo(fuelType: 'petrol' | 'diesel' | 'kerosene' | 'gas'): FuelDisplayInfo {
    const status = this.station.fuelStatus?.[fuelType];
    const rawPrice = this.station.rawFuelPrices?.[fuelType];

    if (status) {
      let numericQueueLength: number | undefined = undefined;
      if (status.queueLength !== null) {
        switch (status.queueLength) {
          case "None": numericQueueLength = 0; break;
          case "Short": numericQueueLength = 1; break;
          case "Medium": numericQueueLength = 2; break;
          case "Long": numericQueueLength = 3; break;
        }
      }

      return {
        type: 'reported',
        available: status.available,
        price: status.price ?? undefined,
        queueLength: numericQueueLength,
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

  getFuelTypeName(fuelType: 'petrol' | 'diesel' | 'kerosene' | 'gas'): string {
    const names: Record<string, string> = {
      petrol: 'Petrol',
      diesel: 'Diesel',
      kerosene: 'Kerosene',
      gas: 'Gas'
    };
    return names[fuelType];
  }

  getFuelIconColor(fuelType: 'petrol' | 'diesel' | 'kerosene' | 'gas'): string {
    const colors: Record<string, string> = {
      petrol: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
      diesel: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
      kerosene: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300',
      gas: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300'
    };
    return colors[fuelType];
  }

  getFuelIconPath(fuelType: 'petrol' | 'diesel' | 'kerosene' | 'gas'): string {
    const paths: Record<string, string> = {
      petrol: 'M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zm14 3H2v11a2 2 0 002 2h12a2 2 0 002-2V7zM6 9a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z',
      diesel: 'M2 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm10 3H4V5h8v2zm0 3H4V8h8v2zm-8 3h8v2H4v-2z',
      kerosene: 'M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z',
      gas: 'M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8.333L14 10V6a2 2 0 00-2-2H4zm3 5a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z'
    };
    return paths[fuelType];
  }

  getReliabilityRingColor(score: number): string {
    if (score >= 4) return 'border-green-500 dark:border-green-400 text-green-500 dark:text-green-400';
    if (score >= 3) return 'border-yellow-500 dark:border-yellow-400 text-yellow-500 dark:text-yellow-400';
    return 'border-red-500 dark:border-red-400 text-red-500 dark:text-red-400';
  }

  getTimeAgo(timestamp: string | null | undefined): string {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diff = now - time;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  getTrendWidth(fuelType: 'petrol' | 'diesel' | 'kerosene' | 'gas'): string {
    // Placeholder for future sparkline implementation
    // This would show price trend data
    const info = this.getFuelDisplayInfo(fuelType);
    if (info.type === 'none') return '0%';
    
    // Mock trend data - in real implementation, this would come from historical data
    const mockTrends = { petrol: '75%', diesel: '60%', kerosene: '45%', gas: '80%' };
    return mockTrends[fuelType];
  }

  getOverallQueueStatus(): boolean {
    // Check if any fuel type has queue information
    return this.fuelTypes.some(fuelType => {
      const status = this.station.fuelStatus?.[fuelType];
      return status?.queueLength && status.queueLength !== 'None';
    });
  }

  getQueueTimeEstimate(): string {
    // Find the longest queue and estimate time
    let maxQueue = 0;
    this.fuelTypes.forEach(fuelType => {
      const status = this.station.fuelStatus?.[fuelType];
      if (status?.queueLength) {
        switch (status.queueLength) {
          case 'Short': maxQueue = Math.max(maxQueue, 1); break;
          case 'Medium': maxQueue = Math.max(maxQueue, 2); break;
          case 'Long': maxQueue = Math.max(maxQueue, 3); break;
        }
      }
    });

    const timeEstimates = ['0 min', '5 min', '15 min', '30+ min'];
    return timeEstimates[maxQueue] || '0 min';
  }

  getQueueBarWidth(): string {
    let maxQueue = 0;
    this.fuelTypes.forEach(fuelType => {
      const status = this.station.fuelStatus?.[fuelType];
      if (status?.queueLength) {
        switch (status.queueLength) {
          case 'Short': maxQueue = Math.max(maxQueue, 1); break;
          case 'Medium': maxQueue = Math.max(maxQueue, 2); break;
          case 'Long': maxQueue = Math.max(maxQueue, 3); break;
        }
      }
    });

    const widths = ['0%', '25%', '60%', '90%'];
    return widths[maxQueue] || '0%';
  }

  getQueueBarClass(): string {
    let maxQueue = 0;
    this.fuelTypes.forEach(fuelType => {
      const status = this.station.fuelStatus?.[fuelType];
      if (status?.queueLength) {
        switch (status.queueLength) {
          case 'Short': maxQueue = Math.max(maxQueue, 1); break;
          case 'Medium': maxQueue = Math.max(maxQueue, 2); break;
          case 'Long': maxQueue = Math.max(maxQueue, 3); break;
        }
      }
    });

    const classes = ['bg-green-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500'];
    return classes[maxQueue] || 'bg-green-500';
  }

  private calculateTravelTime(): void {
    if (this.station.distance) {
      // Rough estimate assuming 40km/h average speed in urban areas
      this.estimatedTravelTime = Math.round(this.station.distance * 1.5);
    }
  }
}