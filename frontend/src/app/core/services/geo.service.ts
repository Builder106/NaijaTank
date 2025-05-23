import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GeoService {
  
  constructor() {}

  getCurrentPosition(): Observable<GeolocationPosition> {
    return from(
      new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported by this browser.'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position),
          (error) => {
            switch (error.code) {
              case error.PERMISSION_DENIED:
                reject(new Error('User denied the request for Geolocation.'));
                break;
              case error.POSITION_UNAVAILABLE:
                reject(new Error('Location information is unavailable.'));
                break;
              case error.TIMEOUT:
                reject(new Error('The request to get user location timed out.'));
                break;
              default:
                reject(new Error('An unknown error occurred while trying to get location.'));
                break;
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000, // 10 seconds
            maximumAge: 0, // Do not use a cached position
          }
        );
      })
    ).pipe(
      catchError((error) => {
        // Log the error or show a user-friendly message
        console.error('Geolocation error:', error.message);
        return throwError(() => new Error(error.message)); // Re-throw the error or a custom error
      })
    );
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return parseFloat(distance.toFixed(1));
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}