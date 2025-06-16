import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppState } from '../../store';
import { Station } from '../../core/models/station.model';
import * as StationSelectors from '../../store/selectors/station.selectors';
import * as StationActions from '../../store/actions/station.actions';
import { EnhancedStationCardComponent } from '../../shared/components/enhanced-station-card/enhanced-station-card.component';
import { FilterBarComponent } from '../../shared/components/filter-bar/filter-bar.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';

@Component({
  selector: 'app-stations-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    EnhancedStationCardComponent,
    FilterBarComponent,
    LoaderComponent
  ],
  template: `
    <div class="min-h-screen bg-gray-50 pb-20">
      <header class="bg-primary-500 text-white p-4">
        <div class="container mx-auto">
          <h1 class="text-2xl font-bold">Nearby Stations</h1>
          <p class="text-sm opacity-90" *ngIf="filters$ | async as filters">Showing results within {{ filters.maxDistance }} km</p>
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
        
        <div *ngIf="error$ | async as error" class="text-center py-8 text-red-600 bg-red-100 p-4 rounded-md">
          <p>Error loading stations: {{ error.message || error }}</p>
        </div>
        
        <div *ngIf="!(loading$ | async) && !(error$ | async) && (stations$ | async)?.length === 0" class="text-center py-8">
          <div class="bg-white rounded-lg p-6 shadow-md max-w-md mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 mx-auto text-gray-400 mb-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <h3 class="text-xl font-bold mb-2">No stations found</h3>
            <p class="text-gray-600 mb-4">Try adjusting your filters or location to find more stations.</p>
            <button class="btn btn-primary">Update Location</button>
          </div>
        </div>
        
        <div *ngIf="!(loading$ | async) && !(error$ | async) && (stations$ | async) && (stations$ | async)!.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <app-enhanced-station-card 
            *ngFor="let station of stations$ | async" 
            [station]="station"
            (viewDetails)="onStationSelected($event)">
          </app-enhanced-station-card>
        </div>
      </section>
    </div>
  `
})
export class StationsListComponent implements OnInit {
  stations$: Observable<Station[]>;
  loading$: Observable<boolean>;
  error$: Observable<any | null>;
  filters$: Observable<StationSelectors.StationState['filters']>; // For maxDistance in template

  constructor(private store: Store<AppState>) {
    this.stations$ = this.store.select(StationSelectors.selectAllStations);
    this.loading$ = this.store.select(StationSelectors.selectStationsLoading);
    this.error$ = this.store.select(StationSelectors.selectStationsError);
    this.filters$ = this.store.select(StationSelectors.selectStationFilters);
  }

  ngOnInit(): void {
    // Dispatch action to load stations if not already loaded,
    // e.g., based on current geo-location or default.
    // This typically happens in a higher-level component or route guard/resolver
    // For now, assume stations are loaded based on user's location interaction elsewhere.
  }

  onStationSelected(station: Station): void {
    this.store.dispatch(StationActions.selectStation({ stationId: station.id }));

    // If it's a Google-sourced station and details haven't been fetched yet,
    // and it's not currently linking or loading details, trigger detail fetch.
    if (
      station.source === 'google' && 
      station.google_place_id &&
      !station.detailsFetched &&
      !station.isLinking
    ) {
      // We might want to check individual loading state here if available
      // this.store.select(StationSelectors.selectStationDetailsLoading(station.id)).pipe(take(1)).subscribe(isLoading => {
      //   if (!isLoading) {
      //     this.store.dispatch(StationActions.triggerGooglePlaceDetailsFetch({ stationId: station.id, placeId: station.google_place_id! }));
      //   }
      // });
      // For simplicity now, dispatching directly. Reducer/Effects should handle ongoing operations.
      this.store.dispatch(StationActions.triggerGooglePlaceDetailsFetch({ stationId: station.id, placeId: station.google_place_id }));
    } else if (station.source === 'db' && !station.detailsFetched) {
      // Optionally, if DB stations might also need a separate detail fetch action
      // this.store.dispatch(StationActions.loadStationDetails({ stationId: station.id }));
      // For now, assuming loadStationDetails is for refreshing or explicit detail view
    }
    // Navigation to a detail page would happen here or be handled by the card itself via routerLink
    // e.g., this.router.navigate(['/stations', station.id]);
  }
}