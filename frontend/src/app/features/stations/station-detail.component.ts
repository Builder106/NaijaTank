import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription, combineLatest, of } from 'rxjs';
import { map, filter, switchMap, take } from 'rxjs/operators';
import { AppState } from '../../store';
import { Station } from '../../core/models/station.model';
import { GasStationBrand } from '../../../../../shared/enums';
import * as StationActions from '../../store/actions/station.actions';
import * as StationSelectors from '../../store/selectors/station.selectors';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { FuelStatusCardComponent } from '../../shared/components/fuel-status-card/fuel-status-card.component';

@Component({
  selector: 'app-station-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoaderComponent,
    FuelStatusCardComponent
  ],
  template: `
    <div class="min-h-screen bg-gray-50 pb-20 relative">
      <div *ngIf="isLoading$ | async" class="absolute inset-0 bg-white bg-opacity-75 flex flex-col items-center justify-center z-20">
        <app-loader></app-loader>
        <p class="mt-2 text-sm text-gray-600">{{ (isLinking$ | async) ? 'Verifying station...' : 'Loading station details...' }}</p>
      </div>

      <div *ngIf="error$ | async as errorMsg" class="container mx-auto p-4">
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong class="font-bold">Error: </strong>
          <span class="block sm:inline">{{ errorMsg.message || errorMsg }}</span>
        </div>
      </div>
      
      <ng-container *ngIf="station$ | async as station">
        <!-- Station Header -->
        <header class="bg-primary-500 text-white p-4 sticky top-0 z-10 shadow-md">
          <div class="container mx-auto">
            <div class="flex items-center mb-1">
              <button (click)="goBack()" class="mr-2 p-1.5 rounded-full hover:bg-primary-600 transition-colors">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div class="flex items-center gap-3 min-w-0">
                <img *ngIf="station.logoUrl" [src]="station.logoUrl" alt="{{getBrandName(station.brand)}} logo" class="h-10 w-10 object-contain rounded-sm bg-white p-0.5 flex-shrink-0">
                <div *ngIf="!station.logoUrl && station.brand" class="h-10 w-10 rounded-sm bg-primary-400 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                  {{ getBrandInitial(station.brand) }}
                </div>
                <div class="min-w-0">
                  <h1 class="text-xl font-bold truncate" title="{{station.name}}">{{station.name}}</h1>
                  <p class="text-xs opacity-80 truncate" title="{{station.address}}">{{station.address}}</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <!-- Station Details Content -->
        <div class="container mx-auto px-4 py-5">
          <!-- Quick Actions -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5 text-xs">
            <a [href]="'https://www.google.com/maps/dir/?api=1&destination=' + station.latitude + ',' + station.longitude" 
              target="_blank" rel="noopener noreferrer"
              class="quick-action-button">
              <svg class="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159-.69.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>
              <span>Directions</span>
            </a>
            <a [href]="'tel:' + station.contact?.phone" *ngIf="station.contact?.phone"
              class="quick-action-button">
              <svg class="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
              <span>Call</span>
            </a>
            <button (click)="toggleFavorite(station)" class="quick-action-button" [disabled]="isLinking$ | async">
              <svg class="w-5 h-5 mb-0.5" [class.fill-red-500]="isFavorite$ | async" [class.text-red-500]="isFavorite$ | async" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
              <span>{{ (isFavorite$ | async) ? 'Saved' : 'Save'}}</span>
            </button>
            <button (click)="reportFuel(station)" class="quick-action-button" [disabled]="isLinking$ | async">
              <svg class="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
              <span>Report</span>
            </button>
          </div>
          
          <!-- Info Card Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div class="bg-white rounded-lg shadow p-4 space-y-2.5 text-sm">
              <h2 class="text-base font-semibold text-gray-700 mb-2">Station Details</h2>
              <div *ngIf="getBrandName(station.brand)"><strong class="text-gray-600 w-20 inline-block">Brand:</strong> {{getBrandName(station.brand)}}</div>
              <div *ngIf="station.source"><strong class="text-gray-600 w-20 inline-block">Source:</strong> <span class="capitalize" title="{{station.google_place_id}}">{{station.source}}</span></div>
              <div *ngIf="station.contact?.website"><strong class="text-gray-600 w-20 inline-block">Website:</strong> <a [href]="station.contact!.website" target="_blank" class="text-primary-600 hover:underline truncate">{{station.contact!.website}}</a></div>
              <div *ngIf="station.operatingHours"><strong class="text-gray-600 w-20 inline-block">Hours:</strong> {{formatOperatingHours(station.operatingHours)}}</div>
              <div *ngIf="station.types && station.types.length > 0"><strong class="text-gray-600 w-20 inline-block">Types:</strong> <span class="flex-wrap"><span *ngFor="let type of station.types.slice(0,4); let i=index" class="text-gray-700 text-xs"><span *ngIf="i>0">, </span>{{type.replace('_', ' ') | titlecase}}</span></span></div>
              <div *ngIf="station.reliabilityScore !== null"><strong class="text-gray-600 w-20 inline-block">Rating:</strong> {{station.reliabilityScore.toFixed(1)}}/5 <span class="text-xs text-gray-500">({{station.reportCount || 0}} reports)</span></div>
              <div *ngIf="station.lastReported"><strong class="text-gray-600 w-20 inline-block">Updated:</strong> {{formatDate(station.lastReported)}}</div>
            </div>

            <div class="bg-white rounded-lg shadow p-4 text-sm">
              <h2 class="text-base font-semibold text-gray-700 mb-3">Fuel Availability & Prices</h2>
              <div *ngIf="station && station.id" class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div *ngFor="let fuel of fuelTypesForCard">
                  <app-fuel-status-card
                    [fuelType]="fuel"
                    [fuelStatus]="station.fuelStatus && station.fuelStatus[fuel] ? station.fuelStatus[fuel] : null"
                    [stationId]="station.id">
                  </app-fuel-status-card>
                </div>
              </div>
              <div *ngIf="station && !station.fuelStatus && !station.rawFuelPrices" class="mt-3">
                 <p class="text-gray-500 text-xs">(No fuel status or estimated price information available for this station)</p>
              </div>
            </div>
          </div>
          
          <!-- Fuel History / Reports (Placeholder) -->
          <div class="bg-white rounded-lg shadow p-4 text-sm">
             <h2 class="text-base font-semibold text-gray-700 mb-2">Recent Reports</h2>
             <p class="text-gray-500">(Fuel report history will be shown here - Coming soon)</p>
          </div>

        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    @reference "../../../styles.css";

    .quick-action-button {
      @apply flex flex-col items-center justify-center bg-white rounded-lg shadow p-2 text-center text-gray-700 hover:bg-gray-50 transition-colors;
    }
  `]
})
export class StationDetailComponent implements OnInit, OnDestroy {
  station$: Observable<Station | null>;
  isLoading$: Observable<boolean>;
  isLinking$: Observable<boolean>;
  error$: Observable<any | null>;
  isFavorite$: Observable<boolean>;
  
  fuelTypesForCard: Array<'petrol' | 'diesel' | 'kerosene' | 'gas'> = ['petrol', 'diesel', 'kerosene', 'gas'];
  private stationId: string | null = null;
  private subscriptions = new Subscription();
  
  constructor(
    private store: Store<AppState>,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.station$ = this.store.select(StationSelectors.selectCurrentStation);
    this.isLoading$ = combineLatest([
      this.store.select(StationSelectors.selectStationsLoading),
      this.station$.pipe(switchMap(st => st ? this.store.select(StationSelectors.selectStationDetailsLoading(st.id)) : of(false)))
    ]).pipe(map(([globalLoading, detailsLoading]) => globalLoading || detailsLoading));

    this.isLinking$ = this.station$.pipe(switchMap(st => st ? this.store.select(StationSelectors.selectStationLinking(st.id)) : of(false)));
    
    this.error$ = this.station$.pipe(switchMap(st => st ? this.store.select(StationSelectors.selectStationDetailsError(st.id)) : of(null)));

    this.isFavorite$ = of(false); 
  }

  ngOnInit(): void {
    const routeSub = this.route.params.pipe(
      map(params => params['id'])
    ).subscribe(id => {
      if (id) {
        this.stationId = id;
        this.store.dispatch(StationActions.selectStation({ stationId: id }));
        
        this.station$.pipe(
          filter(station => !!station && station.id === id),
          take(1)
        ).subscribe(station => {
          if (station) {
            if (station.source === 'google' && !station.detailsFetched && station.google_place_id) {
              this.store.dispatch(StationActions.triggerGooglePlaceDetailsFetch({ stationId: station.id, placeId: station.google_place_id }));
            } else if (!station.detailsFetched) {
              this.store.dispatch(StationActions.loadStationDetails({ stationId: station.id }));
            }
          }
        });
      } else {
        this.router.navigate(['/stations']);
      }
    });
    this.subscriptions.add(routeSub);
  }

  ngOnDestroy(): void {
    this.store.dispatch(StationActions.clearSelectedStation());
    this.subscriptions.unsubscribe();
  }

  goBack(): void {
    this.router.navigate(['/stations']);
  }

  reportFuel(station: Station): void {
    if (!station) return;
    const reportFormAction = { 
      type: '[Navigation] Navigate To Fuel Report Form',
      payload: { stationId: station.id } 
    };

    if (station.source === 'google' && station.id === station.google_place_id && station.google_place_id) {
      this.store.dispatch(StationActions.ensureStationReference({
        station: station,
        onSuccessDispatchAction: { ...reportFormAction, payload: { ...reportFormAction.payload, stationId: 'USE_NEW_STATION_ID' } }
      }));
    } else {
      this.store.dispatch(reportFormAction);
    }
  }

  toggleFavorite(station: Station): void {
    if (!station) return;
    const toggleFavPlaceholderAction = { 
      type: '[User] Toggle Favorite Station',
      payload: { stationId: station.id } 
    };

    if (station.source === 'google' && station.id === station.google_place_id && station.google_place_id) {
      this.store.dispatch(StationActions.ensureStationReference({
        station: station,
        onSuccessDispatchAction: { ...toggleFavPlaceholderAction, payload: { ...toggleFavPlaceholderAction.payload, stationId: 'USE_NEW_STATION_ID' } }
      }));
    } else {
      this.store.dispatch(toggleFavPlaceholderAction); 
      console.log('Toggling favorite for (linked/DB) station:', station.id);
    }
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const hours = Math.floor(diffMins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  getBrandName(brand: GasStationBrand | null): string {
    if (!brand) return 'Unknown Brand';
    return GasStationBrand[brand as keyof typeof GasStationBrand] || brand.toString();
  }

  getBrandInitial(brand: GasStationBrand | null): string {
    const name = this.getBrandName(brand);
    return name && name !== 'Unknown Brand' ? name.charAt(0).toUpperCase() : '?';
  }

  formatOperatingHours(hours: Station['operatingHours']): string {
    if (!hours) return 'N/A';
    if (hours.is24Hours) return 'Open 24 hours';
    if (hours.open && hours.close && hours.open !== 'N/A') {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (timeRegex.test(hours.open) && timeRegex.test(hours.close)) {
         return `${hours.open} - ${hours.close}`;
      }
      if (typeof hours.open === 'string' && hours.open.includes(',')) {
        return hours.open;
      }
    }
    if (typeof hours.open === 'string' && hours.open !== 'N/A') return hours.open; 
    return 'Hours not available';
  }
}