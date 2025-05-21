import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// NgRx
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { reducers, metaReducers } from './store'; // Import reducers and metaReducers

// Routing
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Services
import { SupabaseService } from './core/services/supabase.service';
import { AuthService } from './core/services/auth.service';

// Guards
import { AuthGuard } from './core/guards/auth.guard';

// Environment
import { environment } from '../environments/environment';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    AppRoutingModule,
    
    // NgRx
    StoreModule.forRoot(reducers, { metaReducers }), // Pass reducers and metaReducers
    EffectsModule.forRoot([]), // Keep this for global effects or remove if none
    StoreDevtoolsModule.instrument({
      maxAge: 25, // Retains last 25 states
      logOnly: environment.production, // Restrict extension to log-only mode in production
      autoPause: true, // Pauses recording actions and state changes when the extension window is not open
    }),
  ],
  providers: [
    SupabaseService,
    AuthService,
    AuthGuard
  ],
  bootstrap: [AppComponent]
})
export class AppModule { } 