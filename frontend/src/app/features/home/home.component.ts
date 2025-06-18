import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../store';
import { Station } from '../../core/models/station.model';
import * as StationActions from '../../store/actions/station.actions';
import { EnhancedStationCardComponent } from '../../shared/components/enhanced-station-card/enhanced-station-card.component';
import { GeoService } from '../../core/services/geo.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    EnhancedStationCardComponent
  ],
  template: `
    <!-- Hero Section -->
    <section class="relative bg-primary-900 overflow-hidden min-h-screen">
      <!-- Nigeria Map Background -->
      <div class="absolute inset-0 opacity-20">
        <img src="https://images.pexels.com/photos/4429282/pexels-photo-4429282.jpeg" 
             alt="Nigeria Map" 
             class="w-full h-full object-cover">
      </div>

      <!-- Content -->
      <div class="container mx-auto px-4 pt-32 pb-16 relative">
        <div class="max-w-4xl mx-auto text-center text-white mb-16">
          <h1 class="text-6xl md:text-7xl font-bold mb-8 leading-tight">
            Find Fuel Fast.<br>Together.
          </h1>
          
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a routerLink="/stations" 
               class="btn bg-primary-800 hover:bg-primary-700 text-white border border-primary-700">
              Find Nearby Stations
            </a>
            <a routerLink="/report" 
               class="btn bg-yellow-400 hover:bg-yellow-500 text-black">
              Report Fuel Availability
            </a>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center text-yellow-400 mb-16">
          <div>
            <p class="text-4xl md:text-5xl font-bold mb-2">514</p>
            <p class="text-sm text-white/80">Stations Tracked</p>
          </div>
          <div>
            <p class="text-4xl md:text-5xl font-bold mb-2">24/7</p>
            <p class="text-sm text-white/80">Live Updates</p>
          </div>
          <div>
            <p class="text-4xl md:text-5xl font-bold mb-2">98%</p>
            <p class="text-sm text-white/80">Accuracy Rate</p>
          </div>
        </div>

        <!-- Recent Updates -->
        <div class="max-w-4xl mx-auto">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-white">Nearby Stations</h2>
            <a routerLink="/stations" class="text-yellow-400 hover:text-yellow-300">
              View All →
            </a>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <app-enhanced-station-card 
              *ngFor="let station of stations$ | async" 
              [station]="station"
              (viewDetails)="onStationSelected($event)">
            </app-enhanced-station-card>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="bg-yellow-400 py-16">
      <div class="container mx-auto px-4">
        <div class="max-w-4xl mx-auto text-center">
          <h2 class="text-4xl md:text-5xl font-bold mb-4">
            Join Nigerians<br>
            Finding Fuel Faster.
          </h2>
          <a routerLink="/auth" class="btn bg-black text-white hover:bg-neutral-900 mt-8">
            Start Now
          </a>
        </div>
      </div>
    </section>
  `
})
export class HomeComponent implements OnInit {
  stations$: Observable<Station[]>;

  constructor(
    private store: Store<AppState>,
    private router: Router,
    private geoService: GeoService
  ) {
    this.stations$ = this.store.select(state => state.stations.stations.slice(0, 3));
  }

  ngOnInit(): void {
    this.geoService.getCurrentPosition().subscribe({
      next: (position) => {
        this.store.dispatch(StationActions.loadStations({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          radiusKm: 10
        }));
      },
      error: (err) => {
        console.warn('Failed to get user location, defaulting to Lagos:', err);
        this.store.dispatch(StationActions.loadStations({
          latitude: 6.5244, // Default to Lagos
          longitude: 3.3792,
          radiusKm: 10
        }));
      }
    });
  }

  onStationSelected(station: Station): void {
    this.store.dispatch(StationActions.selectStation({ stationId: station.id }));
    this.router.navigate(['/stations', station.id]);
  }
}