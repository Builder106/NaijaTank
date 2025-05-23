import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../store';
import { Station } from '../../core/models/station.model';
import { selectStation, clearSelectedStation } from '../../store/actions/station.actions';
import { FuelStatusCardComponent } from '../../shared/components/fuel-status-card/fuel-status-card.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { addToFavorites, removeFromFavorites } from '../../store/actions/user.actions';

@Component({
  selector: 'app-station-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FuelStatusCardComponent,
    LoaderComponent
  ],
  template: `
    <div class="min-h-screen bg-gray-50 pb-20">
      <div *ngIf="loading$ | async" class="flex justify-center items-center h-64">
        <app-loader></app-loader>
      </div>
      
      <ng-container *ngIf="selectedStation$ | async as station">
        <!-- Station Header -->
        <header class="bg-primary-500 text-white p-4">
          <div class="container mx-auto">
            <div class="flex items-center mb-2">
              <button 
                (click)="goBack()" 
                class="mr-2 p-1 rounded-full hover:bg-primary-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </button>
              <h1 class="text-2xl font-bold">{{station.name}}</h1>
            </div>
            <p class="text-sm opacity-90">{{station.address}}</p>
          </div>
        </header>
        
        <!-- Station Details -->
        <div class="container mx-auto px-4 py-6">
          <!-- Quick Actions -->
          <div class="flex gap-3 mb-6">
            <a [href]="'https://www.google.com/maps/dir/?api=1&destination=' + station.latitude + ',' + station.longitude" 
              target="_blank" rel="noopener noreferrer"
              class="flex-1 bg-white rounded-lg shadow-md p-3 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 mx-auto mb-1 text-primary-500">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
              <span class="text-sm font-medium">Directions</span>
            </a>
            
            <a [href]="'tel:' + station.contact.phone" *ngIf="station.contact.phone"
              class="flex-1 bg-white rounded-lg shadow-md p-3 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 mx-auto mb-1 text-primary-500">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              <span class="text-sm font-medium">Call</span>
            </a>
            
            <button 
              (click)="toggleFavorite(station.id)" 
              class="flex-1 bg-white rounded-lg shadow-md p-3 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 mx-auto mb-1 text-primary-500" [class.fill-primary-500]="isFavorite$ | async">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              <span class="text-sm font-medium">Save</span>
            </button>
            
            <a 
              routerLink="/report" 
              [queryParams]="{stationId: station.id}"
              class="flex-1 bg-white rounded-lg shadow-md p-3 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 mx-auto mb-1 text-primary-500">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              <span class="text-sm font-medium">Report</span>
            </a>
          </div>
          
          <!-- Info Card -->
          <div class="bg-white rounded-lg shadow-md p-4 mb-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-bold">Station Information</h2>
              <div class="flex items-center">
                <div class="flex items-center mr-2" *ngIf="station.reliabilityScore !== null">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-warning-500 mr-1">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                  <span class="font-medium">{{station.reliabilityScore.toFixed(1)}}</span>
                </div>
                <div class="text-xs bg-gray-100 px-2 py-1 rounded-full" *ngIf="station.reportCount !== null">
                  {{station.reportCount}} reports
                </div>
              </div>
            </div>
            
            <div class="space-y-3">
              <div class="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-gray-500 mr-2 mt-0.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p class="text-sm font-medium text-gray-600">Operating Hours</p>
                  <p class="text-sm">
                    {{station.operatingHours.is24Hours ? 'Open 24 hours' : 
                      (station.operatingHours.open && station.operatingHours.close ? 'Open ' + station.operatingHours.open + ' - ' + station.operatingHours.close : 'N/A')}}
                  </p>
                </div>
              </div>
              
              <div class="flex items-start" *ngIf="station.distance !== null">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-gray-500 mr-2 mt-0.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <div>
                  <p class="text-sm font-medium text-gray-600">Distance</p>
                  <p class="text-sm">{{station.distance}} km away</p>
                </div>
              </div>
              
              <div class="flex items-start" *ngIf="station.contact.phone">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-gray-500 mr-2 mt-0.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                <div>
                  <p class="text-sm font-medium text-gray-600">Phone</p>
                  <p class="text-sm">{{station.contact.phone}}</p>
                </div>
              </div>
              
              <div class="flex items-start" *ngIf="station.contact.website">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-gray-500 mr-2 mt-0.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
                <div>
                  <p class="text-sm font-medium text-gray-600">Website</p>
                  <a [href]="station.contact.website" target="_blank" rel="noopener noreferrer" class="text-sm text-primary-500 hover:underline">
                    {{station.contact.website}}
                  </a>
                </div>
              </div>
              
              <div class="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-gray-500 mr-2 mt-0.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p class="text-sm font-medium text-gray-600">Last Updated Overall</p>
                  <p class="text-sm">{{formatDate(station.lastReported)}}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Fuel Status Section -->
          <h2 class="text-lg font-bold mb-4">Fuel Availability</h2>
          
          <div class="space-y-4">
            <app-fuel-status-card 
              [fuelType]="'petrol'" 
              [fuelStatus]="station.fuelStatus.petrol"
              [stationId]="station.id">
            </app-fuel-status-card>
            
            <app-fuel-status-card 
              [fuelType]="'diesel'"
              [fuelStatus]="station.fuelStatus.diesel"
              [stationId]="station.id">
            </app-fuel-status-card>
            
            <app-fuel-status-card 
              [fuelType]="'kerosene'"
              [fuelStatus]="station.fuelStatus.kerosene"
              [stationId]="station.id">
            </app-fuel-status-card>

            <app-fuel-status-card 
              [fuelType]="'gas'" 
              [fuelStatus]="station.fuelStatus.gas"
              [stationId]="station.id">
            </app-fuel-status-card>
          </div>
        </div>
      </ng-container>
    </div>
  `
})
export class StationDetailComponent implements OnInit {
  selectedStation$: Observable<Station | null>;
  loading$: Observable<boolean>;
  isFavorite$: Observable<boolean>;
  
  constructor(
    private store: Store<AppState>,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.selectedStation$ = this.store.select(state => state.stations.selectedStation);
    this.loading$ = this.store.select(state => state.stations.loading);
    this.isFavorite$ = this.store.select(state => {
      const stationId = state.stations.selectedStation?.id;
      return stationId ? state.user.favorites.includes(stationId) : false;
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.store.dispatch(selectStation({ stationId: params['id'] }));
      }
    });
  }

  goBack(): void {
    this.store.dispatch(clearSelectedStation());
    this.router.navigate(['/stations']);
  }

  toggleFavorite(stationId: string): void {
    this.isFavorite$.subscribe(isFav => {
      if (isFav) {
        this.store.dispatch(removeFromFavorites({ stationId }));
      } else {
        this.store.dispatch(addToFavorites({ stationId }));
      }
    }).unsubscribe();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffMins / 1440);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  }
}