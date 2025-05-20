import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Station } from '../models/station.model';
import { FuelReport } from '../models/fuel-report.model';
import { environment } from '../../../environments/environment';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StationService {
  private apiUrl = `${environment.apiUrl}/stations`;
  
  // Mock data for development
  private mockStations: Station[] = [
    {
      id: '1',
      name: 'Total Energies Lekki',
      brand: 'Total',
      address: '12 Admiralty Way, Lekki Phase 1, Lagos',
      latitude: 6.4281,
      longitude: 3.4219,
      distance: 1.2,
      reliabilityScore: 4.5,
      operatingHours: {
        open: '06:00',
        close: '22:00',
        is24Hours: false
      },
      fuelStatus: {
        pms: {
          available: true,
          price: 600,
          queueLength: 'Short',
          lastUpdated: new Date().toISOString()
        },
        diesel: {
          available: true,
          price: 700,
          queueLength: 'None',
          lastUpdated: new Date().toISOString()
        },
        kerosene: {
          available: false,
          price: null,
          queueLength: null,
          lastUpdated: new Date().toISOString()
        }
      },
      contact: {
        phone: '+2348012345678',
        website: 'https://totalenergies.ng'
      },
      lastReported: new Date().toISOString(),
      reportCount: 15
    },
    {
      id: '2',
      name: 'NNPC Retail Ikoyi',
      brand: 'NNPC',
      address: '45 Awolowo Road, Ikoyi, Lagos',
      latitude: 6.4432,
      longitude: 3.4162,
      distance: 2.5,
      reliabilityScore: 3.8,
      operatingHours: {
        open: '00:00',
        close: '00:00',
        is24Hours: true
      },
      fuelStatus: {
        pms: {
          available: true,
          price: 580,
          queueLength: 'Medium',
          lastUpdated: new Date().toISOString()
        },
        diesel: {
          available: true,
          price: 680,
          queueLength: 'Short',
          lastUpdated: new Date().toISOString()
        },
        kerosene: {
          available: true,
          price: 800,
          queueLength: 'None',
          lastUpdated: new Date().toISOString()
        }
      },
      contact: {
        phone: '+2348023456789',
        website: 'https://nnpcgroup.com'
      },
      lastReported: new Date().toISOString(),
      reportCount: 8
    },
    {
      id: '3',
      name: 'Mobil Surulere',
      brand: 'Mobil',
      address: '24 Adeniran Ogunsanya St, Surulere, Lagos',
      latitude: 6.5015,
      longitude: 3.3615,
      distance: 4.7,
      reliabilityScore: 4.2,
      operatingHours: {
        open: '05:00',
        close: '23:00',
        is24Hours: false
      },
      fuelStatus: {
        pms: {
          available: false,
          price: 610,
          queueLength: null,
          lastUpdated: new Date().toISOString()
        },
        diesel: {
          available: true,
          price: 720,
          queueLength: 'None',
          lastUpdated: new Date().toISOString()
        },
        kerosene: {
          available: false,
          price: null,
          queueLength: null,
          lastUpdated: new Date().toISOString()
        }
      },
      contact: {
        phone: '+2348034567890',
        website: null
      },
      lastReported: new Date().toISOString(),
      reportCount: 12
    }
  ];

  constructor(private http: HttpClient) {}

  getStations(latitude: number, longitude: number, radius: number = 20): Observable<Station[]> {
    // For development, return mock data
    return of(this.mockStations).pipe(delay(800));
    
    // Actual implementation would be:
    // return this.http.get<Station[]>(`${this.apiUrl}`, {
    //   params: { latitude: latitude.toString(), longitude: longitude.toString(), radius: radius.toString() }
    // });
  }

  getStationById(id: string): Observable<Station> {
    // For development, return mock data
    const station = this.mockStations.find(s => s.id === id);
    if (station) {
      return of(station).pipe(delay(300));
    }
    throw new Error('Station not found');
    
    // Actual implementation would be:
    // return this.http.get<Station>(`${this.apiUrl}/${id}`);
  }

  submitFuelReport(stationId: string, report: FuelReport): Observable<FuelReport> {
    // For development, just return the report
    return of(report).pipe(delay(500));
    
    // Actual implementation would be:
    // return this.http.post<FuelReport>(`${this.apiUrl}/${stationId}/reports`, report);
  }
}