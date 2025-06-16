import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataFreshness } from '../../../core/models/station.model';

@Component({
  selector: 'app-data-freshness-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center space-x-1" [attr.title]="getTooltipText()">
      <div class="w-2 h-2 rounded-full" [class]="getIndicatorClass()"></div>
      <span class="text-xs" [class]="getTextClass()">{{ getDisplayText() }}</span>
    </div>
  `
})
export class DataFreshnessIndicatorComponent {
  @Input() freshness!: DataFreshness;

  getIndicatorClass(): string {
    switch (this.freshness.level) {
      case 'fresh':
        return 'bg-green-500 animate-pulse';
      case 'recent':
        return 'bg-yellow-500';
      case 'stale':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  }

  getTextClass(): string {
    switch (this.freshness.level) {
      case 'fresh':
        return 'text-green-600 dark:text-green-400';
      case 'recent':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'stale':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-500';
    }
  }

  getDisplayText(): string {
    if (this.freshness.minutesAgo < 1) return 'Live';
    if (this.freshness.minutesAgo < 60) return `${this.freshness.minutesAgo}m`;
    
    const hours = Math.floor(this.freshness.minutesAgo / 60);
    if (hours < 24) return `${hours}h`;
    
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }

  getTooltipText(): string {
    return `Data is ${this.freshness.level} (updated ${this.freshness.minutesAgo} minutes ago)`;
  }
}