import { Component, ElementRef, NgZone, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { Loader } from '@googlemaps/js-api-loader';
import * as GeolocationActions from '../../../store/actions/geolocation.actions'; 
import * as StationActions from '../../../store/actions/station.actions';

// Define a simple AppState, adjust as per your actual NgRx store structure
interface AppState {
  geolocation: {
    currentPosition: {
      latitude: number | null;
      longitude: number | null;
    };
  };
  // Add other state slices if needed, e.g., for stations
}

@Component({
  selector: 'app-location-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative">
      <input 
        #autocompleteInput
        type="text" 
        placeholder="Enter your location or search..."
        class="w-full px-4 py-3 rounded-lg bg-white bg-opacity-90 shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-700"
      >
    </div>
  `
})
export class LocationSelectorComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('autocompleteInput') autocompleteInput!: ElementRef<HTMLInputElement>;
  
  private autocomplete: google.maps.places.Autocomplete | undefined;
  private placeChangedSubscription: google.maps.MapsEventListener | undefined;
  private googleMapsLoadedSubscription: Subscription | undefined;

  constructor(private store: Store<AppState>, private ngZone: NgZone) {}

  ngOnInit(): void {
    // Placeholder for any OnInit logic if needed beyond maps loading
  }

  async ngAfterViewInit(): Promise<void> {
    const loader = new Loader({
      apiKey: import.meta.env.NG_APP_GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['places']
    });

    try {
      await loader.load();
      this.initAutocomplete();
    } catch (e) {
      console.error('Error loading Google Maps SDK or Places library', e);
    }
  }

  private initAutocomplete(): void {
    if (this.autocompleteInput && this.autocompleteInput.nativeElement) {
      this.autocomplete = new google.maps.places.Autocomplete(
        this.autocompleteInput.nativeElement,
        {
          types: ['geocode'], // Restrict to geographical location results
          // Optionally, bias to the user's country or current map bounds
          componentRestrictions: { country: "ng" }, 
        }
      );

      this.placeChangedSubscription = this.autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          const place = this.autocomplete?.getPlace();
          if (place && place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            
            console.log('Selected place:', place.name, 'Lat:', lat, 'Lng:', lng);

            // Dispatch action to update user's location in NgRx store
            this.store.dispatch(GeolocationActions.setManualLocation({ latitude: lat, longitude: lng }));
            
            // Dispatch action to re-fetch stations based on the new location
            this.store.dispatch(StationActions.loadStations({ latitude: lat, longitude: lng, radiusKm: 10 }));

          } else {
            console.warn('Selected place does not have geometry or location.');
            // Optionally, handle cases where a place is selected but has no geometry (e.g., clear previous selection or show error)
          }
        });
      });
    } else {
      console.error('Autocomplete input element not found.');
    }
  }

  ngOnDestroy(): void {
    if (this.placeChangedSubscription) {
      this.placeChangedSubscription.remove();
    }
    if (this.googleMapsLoadedSubscription) {
      this.googleMapsLoadedSubscription.unsubscribe();
    }
    // Clean up Google Maps Autocomplete instance if necessary (though it's usually managed by the API)
    // For example, if you had manually bound events to the input, you might unbind them here.
    // google.maps.event.clearInstanceListeners(this.autocompleteInput.nativeElement);
  }
}