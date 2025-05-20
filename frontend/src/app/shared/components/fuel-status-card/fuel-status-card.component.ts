import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FuelStatus } from '../../../core/models/station.model';

@Component({
  selector: 'app-fuel-status-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
      <div class="p-4 flex justify-between items-center" [ngClass]="getHeaderClass()">
        <div class="flex items-center">
          <div class="w-10 h-10 rounded-full flex items-center justify-center bg-white bg-opacity-20 mr-3">
            <span class="fuel-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />
              </svg>
            </span>
          </div>
          <div>
            <h3 class="font-bold">{{getFuelTypeName()}}</h3>
            <p class="text-sm font-medium">
              {{fuelStatus.available ? 'Available' : 'Unavailable'}}
            </p>
          </div>
        </div>
        <div class="text-right">
          <p *ngIf="fuelStatus.available && fuelStatus.price" class="text-xl font-bold">
            ₦{{fuelStatus.price}}
          </p>
          <p *ngIf="fuelStatus.available && fuelStatus.queueLength" class="text-sm font-medium">
            {{fuelStatus.queueLength}} Queue
          </p>
        </div>
      </div>
      
      <div class="p-4 bg-gray-50 flex items-center justify-between">
        <div class="text-sm text-gray-500">
          Updated {{getTimeAgo(fuelStatus.lastUpdated)}}
        </div>
        
        <a 
          [routerLink]="['/report']" 
          [queryParams]="{stationId: stationId, fuelType: fuelType}"
          class="text-sm font-medium text-primary-500 hover:text-primary-600">
          Update Status
        </a>
      </div>
    </div>
  `
})
export class FuelStatusCardComponent {
  @Input() fuelType!: 'pms' | 'diesel' | 'kerosene';
  @Input() fuelStatus!: FuelStatus;
  @Input() stationId!: string;
  
  getFuelTypeName(): string {
    const types = {
      'pms': 'Petrol (PMS)',
      'diesel': 'Diesel (AGO)',
      'kerosene': 'Kerosene (DPK)'
    };
    return types[this.fuelType];
  }
  
  getHeaderClass(): string {
    if (!this.fuelStatus.available) {
      return 'bg-gray-200 text-gray-700';
    }
    
    if (this.fuelType === 'pms') {
      return 'bg-primary-500 text-white';
    } else if (this.fuelType === 'diesel') {
      return 'bg-warning-500 text-white';
    } else {
      return 'bg-blue-500 text-white';
    }
  }
  
  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours} hours ago`;
    } else {
      const days = Math.floor(diffMins / 1440);
      return `${days} days ago`;
    }
  }
}