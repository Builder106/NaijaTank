import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-location-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative">
      <input 
        type="text" 
        placeholder="Enter your location"
        class="w-full px-4 py-3 rounded-lg bg-white bg-opacity-90 shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
    </div>
  `
})
export class LocationSelectorComponent {}