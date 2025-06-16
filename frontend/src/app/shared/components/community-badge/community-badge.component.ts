import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommunityData } from '../../../core/models/station.model';

@Component({
  selector: 'app-community-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center space-x-2 text-xs">
      <!-- Verification Badge -->
      <div *ngIf="communityData.verificationBadge" 
           class="flex items-center space-x-1 text-blue-600 dark:text-blue-400"
           title="Community verified">
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        <span>Verified</span>
      </div>

      <!-- Recent Visitors -->
      <div *ngIf="communityData.recentVisitors > 0" 
           class="flex items-center space-x-1 text-gray-600 dark:text-gray-400"
           [title]="communityData.recentVisitors + ' people visited today'">
        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
        </svg>
        <span>{{ communityData.recentVisitors }}</span>
      </div>

      <!-- Community Notes Count -->
      <div *ngIf="communityData.communityNotes.length > 0" 
           class="flex items-center space-x-1 text-gray-600 dark:text-gray-400"
           [title]="communityData.communityNotes.length + ' community tips available'">
        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
        </svg>
        <span>{{ communityData.communityNotes.length }} tips</span>
      </div>
    </div>
  `
})
export class CommunityBadgeComponent {
  @Input() communityData!: CommunityData;
}