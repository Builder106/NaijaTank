import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Station } from '../../../core/models/station.model';

@Component({
  selector: 'app-station-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card hover:shadow-lg transition-shadow duration-200 cursor-pointer">
      <div class="bg-primary-500 p-3 text-white flex justify-between items-center">
        <div>
          <h3 class="font-bold text-lg">{{station.name}}</h3>
          <p class="text-sm opacity-90">{{station.brand}}</p>
        </div>
        <div class="text-right">
          <p class="text-xl font-bold">{{station.distance}} km</p>
          <p class="text-xs opacity-90">away</p>
        </div>
      </div>
      
      <div class="p-4">
        <p class="text-sm text-gray-600 mb-4">{{station.address}}</p>
        
        <div class="flex flex-wrap gap-2 mb-4">
          <div class="flex items-center text-sm" 
            [class.text-success-500]="station.fuelStatus.pms.available" 
            [class.text-gray-400]="!station.fuelStatus.pms.available">
            <span class="font-medium mr-1">PMS:</span>
            <span *ngIf="station.fuelStatus.pms.available">
              ₦{{station.fuelStatus.pms.price}}
              <span *ngIf="station.fuelStatus.pms.queueLength" class="ml-1 text-xs">
                ({{station.fuelStatus.pms.queueLength}} Queue)
              </span>
            </span>
            <span *ngIf="!station.fuelStatus.pms.available">Unavailable</span>
          </div>
          
          <div class="flex items-center text-sm" 
            [class.text-success-500]="station.fuelStatus.diesel.available" 
            [class.text-gray-400]="!station.fuelStatus.diesel.available">
            <span class="font-medium mr-1">Diesel:</span>
            <span *ngIf="station.fuelStatus.diesel.available">
              ₦{{station.fuelStatus.diesel.price}}
            </span>
            <span *ngIf="!station.fuelStatus.diesel.available">Unavailable</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center text-xs text-gray-500">
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Updated {{getTimeAgo(station.lastReported)}}</span>
          </div>
          
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1 text-warning-500">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
            <span>{{station.reliabilityScore.toFixed(1)}}</span>
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