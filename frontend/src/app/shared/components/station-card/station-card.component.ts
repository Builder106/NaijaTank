Here's the complete file content with all missing parts filled in:

[Previous content remains exactly the same until the getCompactFuelStatusColor method]

```typescript
  getCompactFuelStatusColor(fuelType: 'petrol' | 'diesel' | 'kerosene' | 'gas'): string {
    const info = this.getFuelDisplayInfo(fuelType);
    if (info.type === 'none') return 'bg-neutral-300 dark:bg-neutral-600';
    return info.available ? 'bg-success-500' : 'bg-error-500';
  }

  getFuelDisplayInfo(fuelType: 'petrol' | 'diesel' | 'kerosene' | 'gas'): FuelDisplayInfo {
    const status = this.station.fuelStatus?.[fuelType];
    const rawPrice = this.station.rawFuelPrices?.[fuelType];

    if (status) {
      return {
        type: 'reported',
        available: status.available,
        price: status.price,
        queueLength: status.queueLength,
        displayText: status.available ? 
          (status.price ? \`₦${status.price}` : 'Available') : 
          'Unavailable',
        statusClass: status.available ? 
          'text-success-600 dark:text-success-400' : 
          'text-error-600 dark:text-error-400'
      };
    } else if (rawPrice) {
      return {
        type: 'estimated',
        available: true,
        price: rawPrice,
        displayText: \`₦${rawPrice}`,
        statusClass: 'text-neutral-600 dark:text-neutral-400'
      };
    }

    return {
      type: 'none',
      displayText: 'No data',
      statusClass: 'text-neutral-500 dark:text-neutral-400'
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
    if (score >= 4) return 'border-success-500 dark:border-success-400';
    if (score >= 3) return 'border-warning-500 dark:border-warning-400';
    return 'border-error-500 dark:border-error-400';
  }

  getTimeAgo(timestamp: number | null | undefined): string {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return \`${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return \`${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return \`${days}d ago`;
  }

  private calculateTravelTime(): void {
    if (this.station.distance) {
      // Rough estimate assuming 40km/h average speed in urban areas
      this.estimatedTravelTime = Math.round(this.station.distance * 1.5);
    }
  }
}
```