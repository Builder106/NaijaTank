import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../store';
import { Station } from '../../core/models/station.model';
import { StationCardComponent } from '../../shared/components/station-card/station-card.component';
import { FilterBarComponent } from '../../shared/components/filter-bar/filter-bar.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';

@Component({
  selector: 'app-stations-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    StationCardComponent,
    FilterBarComponent,
    LoaderComponent
  ],
  template: `
    <div class="min-h-screen bg-gray-50 pb-20">
      <header class="bg-primary-500 text-white p-4">
        <div class="container mx-auto">
          <h1 class="text-2xl font-bold">Nearby Stations</h1>
          <p class="text-sm opacity-90">Showing results within {{maxDistance}} km</p>
        </div>
      </header>
      
      <!-- Filter Bar -->
      <app-filter-bar class="sticky top-0 z-10 shadow-md"></app-filter-bar>
      
      <!-- View Toggle -->
      <div class="container mx-auto px-4 py-2 flex justify-end">
        <a 
          routerLink="/map"
          class="bg-white px-3 py-2 rounded-lg shadow-md text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
          </svg>
          Map View
        </a>
      </div>
      
      <!-- Station List -->
      <section class="container mx-auto px-4 py-4">
        <div *ngIf="loading$ | async" class="flex justify-center py-8">
          <app-loader></app-loader>
        </div>
        
        <div *ngIf="!(loading$ | async) && (stations$ | async)?.length === 0" class="text-center py-8">
          <div class="bg-white rounded-lg p-6 shadow-md max-w-md mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 mx-auto text-gray-400 mb-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <h3 class="text-xl font-bold mb-2">No stations found</h3>
            <p class="text-gray-600 mb-4">Try adjusting your filters or location to find more stations.</p>
            <button class="btn btn-primary">Update Location</button>
          </div>
        </div>
        
        <div *ngIf="!(loading$ | async) && (stations$ | async) && (stations$ | async)!.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <app-station-card 
            *ngFor="let station of stations$ | async" 
            [station]="station" 
            [routerLink]="['/stations', station.id]">
          </app-station-card>
        </div>
      </section>
    </div>
  `
})
export class StationsListComponent implements OnInit {
  stations$: Observable<Station[]>;
  loading$: Observable<boolean>;
  maxDistance: number = 20; // Default radius

  constructor(private store: Store<AppState>) {
    this.stations$ = this.store.select(state => state.stations.stations);
    this.loading$ = this.store.select(state => state.stations.loading);
    this.store.select(state => state.stations.filters.maxDistance)
      .subscribe(distance => this.maxDistance = distance);
  }

  ngOnInit(): void {
    // If needed, we could dispatch an action to load stations here
  }
}