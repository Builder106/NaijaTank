import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../store';
import { Station } from '../../core/models/station.model';
import { selectStation } from '../../store/actions/station.actions';
import { StationInfoCardComponent } from '../../shared/components/station-info-card/station-info-card.component';
import { FilterBarComponent } from '../../shared/components/filter-bar/filter-bar.component';
import { environment } from '../../../environments/environment';

// Mapbox import would normally be done like this:
// import * as mapboxgl from 'mapbox-gl';

@Component({
  selector: 'app-map',
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
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
        <button 
          (click)="zoomOut()"
          class="bg-white p-2 rounded-full shadow-lg text-gray-700 hover:bg-gray-50">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" />
          </svg>
        </button>
        <button 
          (click)="centerOnUser()"
          class="bg-primary-500 p-2 rounded-full shadow-lg text-white hover:bg-primary-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
        </button>
      </div>
      
      <!-- View Toggle -->
      <div class="absolute top-24 right-4 z-10">
        <a 
          routerLink="/stations"
          class="bg-white px-3 py-2 rounded-lg shadow-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          List View
        </a>
      </div>
    </div>
  `
})
export class MapComponent implements OnInit, AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  
  stations$: Observable<Station[]>;
  selectedStation$: Observable<Station | null>;
  userPosition$: Observable<{latitude: number | null, longitude: number | null}>;
  
  private map: any; // This would be mapboxgl.Map
  private markers: any[] = []; // This would be mapboxgl.Marker[]
  
  constructor(private store: Store<AppState>) {
    this.stations$ = this.store.select(state => state.stations.stations);
    this.selectedStation$ = this.store.select(state => state.stations.selectedStation);
    this.userPosition$ = this.store.select(state => state.geolocation.currentPosition);
  }

  ngOnInit(): void {
    // Initialization logic
  }

  ngAfterViewInit(): void {
    // In a real implementation, this would initialize the map with Mapbox
    // mapboxgl.accessToken = environment.mapboxToken;
    
    // this.map = new mapboxgl.Map({
    //   container: this.mapContainer.nativeElement,
    //   style: 'mapbox://styles/mapbox/streets-v11',
    //   center: [3.3792, 6.5244], // Lagos coordinates
    //   zoom: 12
    // });
    
    // this.map.on('load', () => {
    //   this.addMarkersToMap();
    // });
    
    console.log('Map component initialized');
    
    // For development, we'll simulate having a map
    const element = this.mapContainer.nativeElement;
    element.innerHTML = `
      <div class="h-full w-full flex items-center justify-center bg-gray-200">
        <div class="text-center p-4">
          <h3 class="text-xl font-bold mb-2">Map Visualization</h3>
          <p>Mapbox would render here in production.</p>
          <p class="mt-2 text-sm text-gray-600">In the actual app, you'd see station markers and your current location.</p>
        </div>
      </div>
    `;
  }

  addMarkersToMap(): void {
    // Clear existing markers
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
    
    // Subscribe to stations and add markers
    this.stations$.subscribe(stations => {
      stations.forEach(station => {
        // Create a custom element for the marker
        const el = document.createElement('div');
        el.className = 'station-marker';
        el.innerHTML = `
          <div class="w-10 h-10 rounded-full ${this.getMarkerColorClass(station)} flex items-center justify-center shadow-lg border-2 border-white">
            <span class="text-white font-bold text-xs">
              ${this.getMarkerLabel(station)}
            </span>
          </div>
        `;
        
        // Add click event
        el.addEventListener('click', () => {
          this.store.dispatch(selectStation({ stationId: station.id }));
        });
        
        // Add the marker to the map
        // const marker = new mapboxgl.Marker(el)
        //   .setLngLat([station.longitude, station.latitude])
        //   .addTo(this.map);
        
        // this.markers.push(marker);
      });
    });
  }

  getMarkerColorClass(station: Station): string {
    if (station.fuelStatus.pms.available) {
      return 'bg-success-500';
    } else if (station.fuelStatus.diesel.available || station.fuelStatus.kerosene.available) {
      return 'bg-warning-500';
    } else {
      return 'bg-error-500';
    }
  }

  getMarkerLabel(station: Station): string {
    // Return first letter of brand/name
    return station.brand.charAt(0);
  }

  closeStationInfo(): void {
    this.store.dispatch({ type: '[Station] Clear Selected Station' });
  }

  zoomIn(): void {
    // this.map.zoomIn();
    console.log('Zoom in');
  }

  zoomOut(): void {
    // this.map.zoomOut();
    console.log('Zoom out');
  }

  centerOnUser(): void {
    this.userPosition$.subscribe(position => {
      if (position.latitude && position.longitude) {
        // this.map.flyTo({
        //   center: [position.longitude, position.latitude],
        //   zoom: 15
        // });
        console.log(`Center on user: ${position.latitude}, ${position.longitude}`);
      }
    });
  }
}