import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../store';
import { Station } from '../../core/models/station.model';
import { StationCardComponent } from '../../shared/components/station-card/station-card.component';
import { LocationSelectorComponent } from '../../shared/components/location-selector/location-selector.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    StationCardComponent,
    LocationSelectorComponent
  ],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Hero Section -->
      <section class="relative bg-primary-500 text-white">
        <div class="container mx-auto px-4 py-12 md:py-20">
          <div class="max-w-3xl mx-auto text-center">
            <h1 class="text-3xl md:text-5xl font-bold mb-4">Find Fuel Fast in Nigeria</h1>
            <p class="text-lg md:text-xl mb-8">Real-time updates on PMS, diesel, and kerosene availability near you</p>
            
            <app-location-selector class="mb-6"></app-location-selector>
            
            <div class="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <a routerLink="/map" class="btn btn-primary bg-white text-primary-500 hover:bg-gray-100">
                <span class="flex items-center justify-center">
                  <span>View Map</span>
                </span>
              </a>
              <a routerLink="/stations" class="btn btn-secondary bg-primary-600 text-white border-white hover:bg-primary-700">
                <span class="flex items-center justify-center">
                  <span>List Nearby Stations</span>
                </span>
              </a>
            </div>
          </div>
        </div>
        
        <!-- Wave Shape Divider -->
        <div class="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" class="fill-gray-50 w-full h-[60px]">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"></path>
          </svg>
        </div>
      </section>
      
      <!-- Nearby Stations Section -->
      <section class="container mx-auto px-4 py-10">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Nearby Stations</h2>
          <a routerLink="/stations" class="text-primary-500 hover:text-primary-600 text-sm font-medium">View All</a>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <app-station-card *ngFor="let station of stations$ | async" [station]="station" (click)="onStationSelect(station.id)"></app-station-card>
        </div>
      </section>
      
      <!-- Quick Report Section -->
      <section class="bg-primary-50 py-10">
        <div class="container mx-auto px-4">
          <div class="max-w-xl mx-auto text-center">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">See a station? Report fuel status!</h2>
            <p class="text-gray-700 mb-6">Help others find fuel by reporting current availability, pricing, and queue status at stations near you.</p>
            <a routerLink="/report" class="btn btn-primary">Submit a Report</a>
          </div>
        </div>
      </section>
      
      <!-- Features Section -->
      <section class="container mx-auto px-4 py-10">
        <h2 class="text-2xl font-bold text-gray-900 mb-10 text-center">How NaijaTank Works</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="card p-6 text-center">
            <div class="bg-primary-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-primary-500">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold mb-3">Find Nearby Stations</h3>
            <p class="text-gray-600">Discover fuel stations within a 20km radius of your location with real-time availability information.</p>
          </div>
          
          <div class="card p-6 text-center">
            <div class="bg-primary-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-primary-500">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold mb-3">Real-Time Updates</h3>
            <p class="text-gray-600">Get the latest information on fuel availability, pricing, and queue length from community reports.</p>
          </div>
          
          <div class="card p-6 text-center">
            <div class="bg-primary-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-primary-500">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold mb-3">Share & Contribute</h3>
            <p class="text-gray-600">Report fuel status at stations you visit and earn reputation points for accurate information.</p>
          </div>
        </div>
      </section>
    </div>
  `
})
export class HomeComponent implements OnInit {
  stations$: Observable<Station[]>;

  constructor(
    private store: Store<AppState>,
    private router: Router
  ) {
    this.stations$ = this.store.select(state => state.stations.stations.slice(0, 3));
  }

  ngOnInit(): void {
    // Home component initializes with existing data
  }

  onStationSelect(stationId: string): void {
    this.router.navigate(['/stations', stationId]);
  }
}