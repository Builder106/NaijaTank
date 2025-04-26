import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Station } from '../../../core/models/station.model';

@Component({
  selector: 'app-station-info-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="bg-white rounded-lg shadow-lg p-4">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="text-lg font-bold">{{station?.name}}</h3>
          <p class="text-sm text-gray-600">{{station?.address}}</p>
        </div>
        <button 
          (click)="close.emit()"
          class="p-1 hover:bg-gray-100 rounded-full">
          <span class="sr-only">Close</span>
          <span class="block w-5 h-5" aria-hidden="true">×</span>
        </button>
      </div>
      
      <div class="space-y-2">
        <div *ngIf="station?.fuelStatus?.pms?.available" class="flex justify-between">
          <span class="text-sm">PMS:</span>
          <span class="font-medium">₦{{station?.fuelStatus?.pms?.price}}</span>
        </div>
        <div *ngIf="station?.fuelStatus?.diesel?.available" class="flex justify-between">
          <span class="text-sm">Diesel:</span>
          <span class="font-medium">₦{{station?.fuelStatus?.diesel?.price}}</span>
        </div>
      </div>
    </div>
  `
})
export class StationInfoCardComponent {
  @Input() station: Station | null = null;
  @Output() close = new EventEmitter<void>();
}