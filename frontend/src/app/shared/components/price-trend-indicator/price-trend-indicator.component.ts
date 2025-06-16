import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PriceTrend } from '../../../core/models/station.model';

@Component({
  selector: 'app-price-trend-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center space-x-1" [attr.title]="getTooltipText()">
      <svg class="w-3 h-3" [class]="getArrowClass()" fill="currentColor" viewBox="0 0 20 20">
        <path [attr.d]="getArrowPath()"/>
      </svg>
      <span class="text-xs font-medium" [class]="getTextClass()">
        {{ trend.change.toFixed(1) }}%
      </span>
    </div>
  `
})
export class PriceTrendIndicatorComponent {
  @Input() trend!: PriceTrend;

  getArrowClass(): string {
    switch (this.trend.direction) {
      case 'up':
        return 'text-red-500 transform rotate-0';
      case 'down':
        return 'text-green-500 transform rotate-180';
      case 'stable':
        return 'text-gray-400 transform rotate-90';
      default:
        return 'text-gray-400';
    }
  }

  getTextClass(): string {
    switch (this.trend.direction) {
      case 'up':
        return 'text-red-600 dark:text-red-400';
      case 'down':
        return 'text-green-600 dark:text-green-400';
      case 'stable':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  }

  getArrowPath(): string {
    return 'M3 10l1.5-1.5L10 14l5.5-5.5L17 10l-7 7-7-7z';
  }

  getTooltipText(): string {
    const direction = this.trend.direction === 'up' ? 'increased' : 
                     this.trend.direction === 'down' ? 'decreased' : 'remained stable';
    return `Price has ${direction} by ${this.trend.change.toFixed(1)}% over the last week`;
  }
}