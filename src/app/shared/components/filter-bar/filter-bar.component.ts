import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white p-4 border-b">
      <div class="container mx-auto">
        <div class="flex items-center gap-4">
          <div class="flex-1">
            <input 
              type="text" 
              placeholder="Search stations..."
              class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
          </div>
          <button class="btn btn-secondary">
            Filter
          </button>
        </div>
      </div>
    </div>
  `
})
export class FilterBarComponent {}