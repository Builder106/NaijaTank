import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { Loader } from '@googlemaps/js-api-loader';
import { Station } from '../../../../core/models/station.model';
import { StationInfoCardComponent } from '../../../../shared/components/station-info-card/station-info-card.component';
import { FilterBarComponent } from '../../../../shared/components/filter-bar/filter-bar.component';
import { environment } from '../../../../../environments/environment';

interface AppState {
  stations: {
    stations: Station[];
    selectedStation: Station | null;
  };
  geolocation: {
    currentPosition: {
      latitude: number | null;
      longitude: number | null;
    }
  }
}

@Component({
  selector: 'app-station-map',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    StationInfoCardComponent,
    FilterBarComponent
  ],
  template: `
    <div class="relative h-screen flex flex-col">
      <!-- Map Container -->
      <div #mapContainer class="w-full flex-grow"></div>
      
      <!-- Filter Bar -->
      <app-filter-bar class="absolute top-4 left-4 right-4 z-10"></app-filter-bar>
      
      <!-- Station Info Card -->
      <app-station-info-card 
        *ngIf="selectedStation$ | async"
        [station]="selectedStation$ | async"
        class="absolute bottom-4 left-4 right-4 z-10"
        (close)="closeStationInfo()">
      </app-station-info-card>
      
      <!-- Map Controls -->
      <div class="absolute bottom-20 right-4 flex flex-col gap-2 z-10">
        <button 
          (click)="zoomIn()"
          class="bg-white p-2 rounded-full shadow-lg text-gray-700 hover:bg-gray-50">
          +
        </button>
        <button 
          (click)="zoomOut()"
          class="bg-white p-2 rounded-full shadow-lg text-gray-700 hover:bg-gray-50">
          -
        </button>
        <button 
          (click)="centerOnUser()"
          class="bg-primary-500 p-2 rounded-full shadow-lg text-white hover:bg-primary-600">
          📍
        </button>
      </div>
      
      <!-- View Toggle -->
      <div class="absolute top-24 right-4 z-10">
        <a 
          routerLink="/stations"
          class="bg-white px-3 py-2 rounded-lg shadow-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
          List View
        </a>
      </div>
    </div>
  `
})
export class StationMapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  
  stations$: Observable<Station[]>;
  selectedStation$: Observable<Station | null>;
  userPosition$: Observable<{latitude: number | null, longitude: number | null}>;
  
  private map: google.maps.Map | null = null;
  private markers: google.maps.Marker[] = [];
  private subscriptions: Subscription[] = [];
  
  constructor(private store: Store<AppState>) {
    this.stations$ = this.store.select(state => state.stations.stations);
    this.selectedStation$ = this.store.select(state => state.stations.selectedStation);
    this.userPosition$ = this.store.select(state => state.geolocation.currentPosition);
  }

  ngOnInit(): void {
    // Initialize subscriptions
    this.subscriptions.push(
      this.stations$.subscribe(stations => {
        if (this.map) {
          this.updateMarkers(stations);
        }
      })
    );
  }

  async ngAfterViewInit(): Promise<void> {
    const loader = new Loader({
      apiKey: environment.googleMapsApiKey,
      version: 'weekly'
    });

    try {
      await loader.load();
      this.initializeMap();
    } catch (error) {
      console.error('Error loading Google Maps:', error);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.markers.forEach(marker => marker.setMap(null));
  }

  private initializeMap(): void {
    if (!this.mapContainer) return;

    // Default to Lagos coordinates
    const defaultCenter = { lat: 6.5244, lng: 3.3792 };

    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      center: defaultCenter,
      zoom: 12,
      styles: this.getMapStyles(),
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    // Subscribe to user position changes
    this.subscriptions.push(
      this.userPosition$.subscribe(position => {
        if (position.latitude && position.longitude) {
          const userLocation = new google.maps.LatLng(position.latitude, position.longitude);
          this.map?.setCenter(userLocation);
          this.updateUserMarker(userLocation);
        }
      })
    );

    // Add markers for stations
    this.stations$.subscribe(stations => {
      this.updateMarkers(stations);
    });
  }

  private updateMarkers(stations: Station[]): void {
    // Clear existing markers
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];

    stations.forEach(station => {
      const marker = new google.maps.Marker({
        position: { lat: station.latitude, lng: station.longitude },
        map: this.map,
        title: station.name,
        icon: this.getMarkerIcon(station)
      });

      marker.addListener('click', () => {
        this.store.dispatch({ type: '[Station] Select Station', stationId: station.id });
      });

      this.markers.push(marker);
    });
  }

  private userMarker: google.maps.Marker | null = null;

  private updateUserMarker(position: google.maps.LatLng): void {
    if (!this.userMarker) {
      this.userMarker = new google.maps.Marker({
        position,
        map: this.map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });
    } else {
      this.userMarker.setPosition(position);
    }
  }

  private getMarkerIcon(station: Station): google.maps.Symbol {
    const color = station.fuelStatus.pms.available ? '#10B981' : 
                 (station.fuelStatus.diesel.available ? '#F59E0B' : '#EF4444');

    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2
    };
  }

  private getMapStyles(): google.maps.MapTypeStyle[] {
    return [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'transit',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ];
  }

  closeStationInfo(): void {
    this.store.dispatch({ type: '[Station] Clear Selected Station' });
  }

  zoomIn(): void {
    if (this.map) {
      this.map.setZoom((this.map.getZoom() || 0) + 1);
    }
  }

  zoomOut(): void {
    if (this.map) {
      this.map.setZoom((this.map.getZoom() || 0) - 1);
    }
  }

  centerOnUser(): void {
    this.userPosition$.subscribe(position => {
      if (position.latitude && position.longitude && this.map) {
        this.map.panTo({ lat: position.latitude, lng: position.longitude });
        this.map.setZoom(15);
      }
    }).unsubscribe();
  }
}