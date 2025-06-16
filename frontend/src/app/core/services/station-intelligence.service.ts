import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Station, DataFreshness, PriceTrend, PeakHours, CommunityData, AvailabilityPrediction } from '../models/station.model';

@Injectable({
  providedIn: 'root'
})
export class StationIntelligenceService {
  private userPreferences = new BehaviorSubject<{
    prioritizePrice: boolean;
    prioritizeDistance: boolean;
    preferredFuelTypes: string[];
    avoidLongQueues: boolean;
  }>({
    prioritizePrice: true,
    prioritizeDistance: true,
    preferredFuelTypes: ['petrol'],
    avoidLongQueues: true
  });

  constructor() {}

  /**
   * Calculate data freshness level based on last update time
   */
  calculateDataFreshness(lastUpdated: string): DataFreshness {
    const now = new Date();
    const updated = new Date(lastUpdated);
    const minutesAgo = Math.floor((now.getTime() - updated.getTime()) / 60000);

    let level: 'fresh' | 'recent' | 'stale';
    if (minutesAgo < 30) level = 'fresh';
    else if (minutesAgo < 120) level = 'recent';
    else level = 'stale';

    return {
      level,
      lastUpdated,
      minutesAgo
    };
  }

  /**
   * Generate mock price trend data (in real app, this would come from historical data)
   */
  generatePriceTrend(currentPrice: number, fuelType: string): PriceTrend {
    // Mock data - in real implementation, fetch from historical price API
    const mockSparklineData = Array.from({ length: 7 }, (_, i) => {
      const variation = (Math.random() - 0.5) * 20; // ±10 naira variation
      return Math.max(0, currentPrice + variation);
    });

    const weekAgoPrice = mockSparklineData[0];
    const change = ((currentPrice - weekAgoPrice) / weekAgoPrice) * 100;

    let direction: 'up' | 'down' | 'stable';
    if (Math.abs(change) < 2) direction = 'stable';
    else direction = change > 0 ? 'up' : 'down';

    return {
      direction,
      change: Math.abs(change),
      sparklineData: mockSparklineData
    };
  }

  /**
   * Determine current peak hours status
   */
  analyzePeakHours(): PeakHours {
    const currentHour = new Date().getHours();
    
    // Mock peak hours data
    const busyPeriods = [
      { start: '07:00', end: '09:00', intensity: 'high' as const },
      { start: '12:00', end: '14:00', intensity: 'medium' as const },
      { start: '17:00', end: '19:00', intensity: 'high' as const }
    ];

    let currentStatus: 'quiet' | 'normal' | 'busy' | 'very_busy' = 'normal';
    
    if ((currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19)) {
      currentStatus = 'very_busy';
    } else if (currentHour >= 12 && currentHour <= 14) {
      currentStatus = 'busy';
    } else if (currentHour >= 22 || currentHour <= 6) {
      currentStatus = 'quiet';
    }

    return {
      busyPeriods,
      currentStatus
    };
  }

  /**
   * Generate community data (mock implementation)
   */
  generateCommunityData(stationId: string): CommunityData {
    // Mock data - in real implementation, fetch from community API
    const mockNotes = [
      {
        id: '1',
        text: 'Back entrance has shorter queue',
        upvotes: 12,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2', 
        text: 'Best prices in the area',
        upvotes: 8,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
      }
    ];

    return {
      recentVisitors: Math.floor(Math.random() * 50) + 5,
      verificationBadge: Math.random() > 0.3,
      lastVerified: Math.random() > 0.5 ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() : null,
      communityNotes: mockNotes.slice(0, Math.floor(Math.random() * 3))
    };
  }

  /**
   * Predict fuel availability
   */
  predictAvailability(station: Station, fuelType: string): AvailabilityPrediction {
    // Mock prediction logic - in real implementation, use ML model
    const currentHour = new Date().getHours();
    const isHighDemandTime = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19);
    
    const likelyToRunOut = isHighDemandTime && Math.random() > 0.7;
    const estimatedTime = likelyToRunOut ? `${currentHour + 2}:00 PM` : null;
    const confidence = Math.floor(Math.random() * 30) + 70; // 70-100%

    return {
      likelyToRunOut,
      estimatedTime,
      confidence
    };
  }

  /**
   * Find alternative stations
   */
  findAlternatives(currentStation: Station, allStations: Station[]): Station['alternativeStations'] {
    if (!currentStation.latitude || !currentStation.longitude) return [];

    return allStations
      .filter(s => s.id !== currentStation.id)
      .map(station => {
        const distance = this.calculateDistance(
          currentStation.latitude!,
          currentStation.longitude!,
          station.latitude!,
          station.longitude!
        );
        
        return {
          id: station.id,
          name: station.name,
          distance,
          estimatedSavings: Math.floor(Math.random() * 10) + 2 // Mock savings in minutes
        };
      })
      .filter(alt => alt.distance < 5) // Within 5km
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2);
  }

  /**
   * Calculate confidence score based on multiple factors
   */
  calculateConfidenceScore(station: Station): number {
    let score = 50; // Base score

    // Recent reports boost confidence
    if (station.reportCount && station.reportCount > 10) score += 20;
    else if (station.reportCount && station.reportCount > 5) score += 10;

    // Reliability score factor
    if (station.reliabilityScore && station.reliabilityScore >= 4) score += 15;
    else if (station.reliabilityScore && station.reliabilityScore >= 3) score += 5;

    // Recent updates boost confidence
    if (station.lastReported) {
      const hoursAgo = (Date.now() - new Date(station.lastReported).getTime()) / (1000 * 60 * 60);
      if (hoursAgo < 2) score += 15;
      else if (hoursAgo < 24) score += 5;
    }

    // Community verification
    if (station.communityData?.verificationBadge) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Get personalized station ranking
   */
  getPersonalizedRanking(stations: Station[]): Observable<Station[]> {
    return this.userPreferences.pipe(
      map(prefs => {
        return stations.map(station => ({
          ...station,
          personalizedScore: this.calculatePersonalizedScore(station, prefs)
        })).sort((a, b) => (b.personalizedScore || 0) - (a.personalizedScore || 0));
      })
    );
  }

  /**
   * Update user preferences based on behavior
   */
  updateUserPreferences(action: string, context: any): void {
    const currentPrefs = this.userPreferences.value;
    
    // Simple learning logic - in real implementation, use more sophisticated ML
    if (action === 'selected_station') {
      if (context.reason === 'price') {
        currentPrefs.prioritizePrice = true;
      } else if (context.reason === 'distance') {
        currentPrefs.prioritizeDistance = true;
      }
    }

    this.userPreferences.next(currentPrefs);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  private calculatePersonalizedScore(station: Station, prefs: any): number {
    let score = 0;

    // Distance factor
    if (prefs.prioritizeDistance && station.distance) {
      score += Math.max(0, 100 - (station.distance * 10));
    }

    // Price factor
    if (prefs.prioritizePrice && station.fuelStatus?.petrol?.price) {
      // Lower prices get higher scores
      score += Math.max(0, 100 - (station.fuelStatus.petrol.price / 10));
    }

    // Queue factor
    if (prefs.avoidLongQueues) {
      const hasLongQueue = Object.values(station.fuelStatus || {}).some(
        fuel => fuel?.queueLength === 'Long'
      );
      if (!hasLongQueue) score += 20;
    }

    return score;
  }
}