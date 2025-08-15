import { ApplicationConfig, isDevMode, provideExperimentalZonelessChangeDetection} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideLottieOptions } from 'ngx-lottie';
import { LottieComponent } from 'ngx-lottie';

import { routes } from './app.routes';
import { reducers, metaReducers } from './store';
import { StationEffects } from './store/effects/station.effects';
import { UserEffects } from './store/effects/user.effects';
import { GeolocationEffects } from './store/effects/geolocation.effects';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideRouter(routes, withInMemoryScrolling({
      scrollPositionRestoration: 'disabled',
      anchorScrolling: 'disabled'
    })),
    provideHttpClient(),
    provideStore(reducers, { metaReducers }),
    provideEffects([StationEffects, UserEffects, GeolocationEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
    provideLottieOptions({
      player: () => import('lottie-web'),
    }),
    LottieComponent,
    ...TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      },
      defaultLanguage: 'en'
    }).providers || []
  ]
};