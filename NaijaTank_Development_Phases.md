# NaijaTank: Development Phases and Steps

This document outlines the phased development approach for the NaijaTank application, adapted to account for the current state of the project.

## File Structure Overview

This section provides a suggested file structure for the project.

### 1. Frontend (Angular)

Based on the existing structure and planned modules:

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── guards/
│   │   │   │   └── auth.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   └── auth.interceptor.ts
│   │   │   ├── models/
│   │   │   │   ├── station.model.ts
│   │   │   │   ├── user.model.ts
│   │   │   │   └── fuel-report.model.ts
│   │   │   └── services/
│   │   │       ├── auth.service.ts
│   │   │       ├── station.service.ts
│   │   │       ├── geo.service.ts
│   │   │       ├── report.service.ts
│   │   │       ├── supabase.service.ts  <!-- New service for Supabase client -->
│   │   │       └── user.service.ts
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── components/
│   │   │   │   │   ├── login/login.component.ts
│   │   │   │   │   └── register/register.component.ts
│   │   │   │   └── auth.module.ts
│   │   │   ├── stations/
│   │   │   │   ├── components/
│   │   │   │   │   ├── station-list/station-list.component.ts
│   │   │   │   │   ├── station-map/station-map.component.ts
│   │   │   │   │   └── station-detail/station-detail.component.ts
│   │   │   │   └── stations.module.ts
│   │   │   ├── reporting/
│   │   │   │   ├── components/
│   │   │   │   │   └── fuel-report-form/fuel-report-form.component.ts
│   │   │   │   └── reporting.module.ts
│   │   │   ├── user/
│   │   │   │   ├── components/
│   │   │   │   │   ├── user-profile/user-profile.component.ts
│   │   │   │   │   └── favorites-list/favorites-list.component.ts
│   │   │   │   └── user.module.ts
│   │   │   └── home/
│   │   │       └── home.component.ts
│   │   ├── shared/
│   │   │   ├── components/ (navbar, footer, search-bar, filter-bar, loader, toast, location-selector, station-card, station-info-card)
│   │   │   ├── pipes/
│   │   │   │   ├── distance.pipe.ts
│   │   │   │   ├── time-ago.pipe.ts
│   │   │   │   └── currency.pipe.ts
│   │   │   ├── directives/
│   │   │   └── shared.module.ts
│   │   ├── store/
│   │   │   ├── actions/
│   │   │   │   ├── auth.actions.ts
│   │   │   │   ├── station.actions.ts
│   │   │   │   ├── report.actions.ts
│   │   │   │   └── user.actions.ts
│   │   │   ├── effects/
│   │   │   │   ├── auth.effects.ts
│   │   │   │   ├── station.effects.ts
│   │   │   │   ├── report.effects.ts
│   │   │   │   └── user.effects.ts
│   │   │   ├── reducers/
│   │   │   │   ├── auth.reducer.ts
│   │   │   │   ├── station.reducer.ts
│   │   │   │   ├── report.reducer.ts
│   │   │   │   └── user.reducer.ts
│   │   │   ├── selectors/ (auth.selectors.ts, etc.)
│   │   │   └── index.ts (AppState, root reducers, meta-reducers)
│   │   ├── app-routing.module.ts
│   │   └── app.module.ts
│   ├── assets/
│   │   ├── i18n/ (for translations: en.json, pidgin.json, etc.)
│   │   └── images/
│   └── environments/
│       ├── environment.ts
│       └── environment.prod.ts
├── .angular-cli.json (or angular.json)
├── package.json
├── tsconfig.app.json
└── tsconfig.json
```

### 2. Supabase Setup

Instead of a traditional Express.js backend, we'll use Supabase for database, authentication, and API functionality:

```
supabase/
├── functions/                  <!-- Supabase Edge Functions -->
│   ├── nearby-stations/        <!-- Function to handle nearby stations search with Google Places API -->
│   │   └── index.ts
│   └── calculate-reliability/  <!-- Function to calculate reliability scores -->
│       └── index.ts
├── migrations/                 <!-- Database migrations -->
│   └── initial-schema.sql
└── seed/                       <!-- Seed data scripts -->
    └── initial-stations.sql
```

## Phase 0: Project Verification & Supabase Setup

**Goal:** Verify existing frontend configuration and set up Supabase as the backend.

**Steps:**

1.  **Project Structure Verification:**
    *   [✓] **All:** Git repository already set up.
    *   [✓] **Frontend:** Angular project initialized with core directory structure.
    *   [✓] **Frontend:** Review and verify existing components, services, and NgRx setup.
2.  **Supabase Setup:**
    *   [✓] Create a Supabase project.
    *   [✓] Install Supabase CLI for local development.
    *   [✓] Install `@supabase/supabase-js` package in the frontend project.
    *   [✓] Create a `SupabaseService` in the frontend to initialize and manage the Supabase client.
3.  **Environment Configuration:**
    *   [✓] **Frontend:** Environment files exist with Google Maps API key configured.
    *   [✓] **Frontend:** Add Supabase URL and public API key to environment files.
    *   [✓] **Frontend:** Update Angular environments for API URL and other required variables.
4.  **Database Schema Setup:**
    *   [✓] Design and create database tables in Supabase:
        *   `profiles` table (extends Supabase Auth users)
        *   `stations` table (with PostGIS point for location)
        *   `fuel_reports` table
        *   `favorite_stations` table (junction table for user favorites)
    *   [✓] Set up appropriate indexes, especially for geospatial queries.
    *   [✓] Configure Row Level Security (RLS) policies for each table to control access.

## Phase 1: Core Authentication with Supabase Auth

**Goal:** Implement user registration and login functionality using Supabase Auth.

**Steps:**

1.  **Supabase Auth Configuration:**
    *   [✓] Configure authentication providers in Supabase dashboard (email/password, Google login).
    *   [✓] Set up email templates for verification, password reset, etc.
        *   [✓] Confirm signup (`email_templates/confirm_signup_template.html`)
        *   [✓] Invite user (`email_templates/invite_user_template.html`)
        *   [✓] Magic Link (login) (`email_templates/magic_link_template.html`)
        *   [✓] Confirm change of email (`email_templates/confirm_change_email_template.html`)
        *   [✓] Reset password (`email_templates/reset_password_template.html`)
    *   [✓] Create a `profiles` table that extends the Supabase Auth users with additional fields.
    *   [✓] Configure appropriate RLS policies for the `profiles` table.
2.  **Frontend - Auth Module & Components:**
    *   [✓] **Verify:** `features/auth` module structure already exists.
    *   [ ] Complete `LoginComponent` and `RegisterComponent` with proper forms and validation.
    *   [In Progress] Create `AuthService` that uses Supabase Auth methods: (Refactored service, needs integration with components & NgRx)
        *   `signUp()` for registration
        *   `signIn()` for login
        *   `signOut()` for logout
        *   Session management
    *   [ ] Implement/enhance NgRx store for Auth state (`user`, `session`, `isAuthenticated`, `loading`, `error`).
        *   Actions: `login`, `loginSuccess`, `loginFailure`, `register`, `registerSuccess`, `registerFailure`, `logout`.
        *   Reducers: Handle auth state changes.
        *   Effects: Handle API calls via `AuthService` and dispatch success/failure actions.
    *   [✓] **Verify:** Routing configuration for auth-related pages.
    *   [ ] Implement session management using Supabase's session handling. (Partially done in AuthService, needs full NgRx integration)
    *   [ ] Implement `AuthGuard` to protect routes requiring authentication.
    *   [ ] Complete logout functionality.

## Phase 2: From Mock Data to Supabase Data

**Goal:** Convert the existing frontend components and services to use Supabase data instead of mock data.

**Steps:**

1.  **Supabase Database Configuration:**
    *   [ ] Define `stations` table with appropriate columns (name, brand, address, latitude, longitude, etc.).
    *   [ ] Define `fuel_reports` table (user_id, station_id, fuel_type, price, is_available, queue_length, reported_at).
    *   [ ] Set up foreign key relationships between tables.
    *   [ ] Configure RLS policies to control access:
        *   Anyone can read stations data.
        *   Only authenticated users can submit reports.
        *   Only admins can add new stations.
    *   [ ] Create SQL functions for common operations (e.g., getting stations with their latest reports).
2.  **Frontend - Adapt Existing Components:**
    *   [✓] **Verify:** `StationsModule` and basic components are already structured.
    *   [✓] **Verify:** Existing `StationCardComponent`, `StationInfoCardComponent`, and other UI components.
    *   [ ] **Update:** Modify `StationService` to use Supabase queries instead of returning mock data:
        *   Replace the mock data in `getStations()` with Supabase queries.
        *   Update `getStationById()` to fetch from Supabase.
    *   [ ] **Review:** Ensure `StationListComponent` and `StationMapComponent` are properly subscribing to the data from `StationService`.
    *   [ ] **Complete:** `StationDetailComponent` to fully display station details and reports from Supabase.
    *   [ ] Create/enhance `ReportService` to submit fuel reports to Supabase.
    *   [ ] Create/complete `FuelReportFormComponent` for users to submit reports.
    *   [ ] Enhance NgRx store for Stations:
        *   Connect existing reducers to new Supabase effects.
        *   Implement effects for API operations (`loadStations`, `getStationById`, etc.).
    *   [ ] Implement NgRx store for Reporting if not already present.
3.  **Initial Data:**
    *   [ ] Create SQL seed scripts to populate the database with initial station data from existing mock data.
    *   [ ] Run seed scripts to add sample data to Supabase.

## Phase 3: Location Services & Nearby Search Enhancement

**Goal:** Enhance the existing location services and integrate Google Places Nearby Search with Supabase.

**Steps:**

1.  **Frontend - Enhance Location Services:**
    *   [✓] **Verify:** Basic `GeoService` is already implemented with current position functionality.
    *   [ ] **Enhance:** Improve error handling and user experience in location detection.
    *   [✓] **Verify:** Map component can center on user's location.
    *   [ ] **Complete:** `LocationSelectorComponent` implementation:
        *   Integrate Google Places Autocomplete API.
        *   On location selection, update user's location in the NgRx store.
        *   Dispatch action to re-fetch stations based on the new location.
2.  **Supabase Geospatial Functionality:**
    *   [ ] Create a PostGIS extension in Supabase if not already enabled.
    *   [ ] Create a SQL function for finding stations within a radius:
        ```sql
        CREATE OR REPLACE FUNCTION get_stations_within_radius(lat float, lng float, radius_km float)
        RETURNS SETOF stations
        LANGUAGE sql
        AS $$
          SELECT * FROM stations
          WHERE ST_DWithin(
            ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
            radius_km * 1000
          );
        $$;
        ```
    *   [ ] **Google Places API Integration:**
        *   Create a Supabase Edge Function to securely call Google Places Nearby Search API.
        *   Implement hybrid data fetching logic in the Edge Function:
            *   Query local DB first.
            *   Query Google Places API as a fallback or to augment results.
            *   Merge and de-duplicate results.
        *   Implement logic to save a station from Google Places to your Supabase DB *primarily upon user interaction*.
3.  **Frontend - Connect to Enhanced Supabase Functionality:**
    *   [ ] Update `StationService` to call the Supabase geospatial function for nearby stations.
    *   [ ] Update `StationService` to call the Edge Function for enhanced nearby search when needed.
    *   [ ] Ensure `StationMapComponent` and `StationListComponent` properly handle and display nearby stations data.

## Phase 4: User Profile & Engagement Features

**Goal:** Allow users to manage their profiles, view their contributions, and save favorite stations.

**Steps:**

1.  **Supabase User Profile & Favorites Setup:**
    *   [ ] Enhance the `profiles` table with additional fields if needed.
    *   [ ] Create `favorite_stations` junction table (user_id, station_id).
    *   [ ] Set up appropriate RLS policies:
        *   Users can only read/write their own profile.
        *   Users can only read/write their own favorites.
    *   [ ] Create SQL functions for common operations (e.g., getting a user's reports, adding/removing favorites).
2.  **Frontend - User Module:**
    *   [✓] **Verify:** Basic structure of `UserModule` or related components.
    *   [ ] Create/complete `UserService` that uses Supabase for profile, reports, and favorites operations.
    *   [ ] Create/enhance `UserProfileComponent` to display user info and past reports.
    *   [ ] Implement "Add to Favorites" / "Remove from Favorites" functionality on station-related components.
    *   [ ] Create/enhance `FavoritesListComponent` if needed.
    *   [ ] Implement or enhance NgRx store for user-specific data.

## Phase 5: Advanced Features & Polish

**Goal:** Implement advanced filtering, search, reliability scoring, and overall UI/UX improvements.

**Steps:**

1.  **Supabase Advanced Functionality:**
    *   [ ] Create SQL functions for advanced filtering:
        ```sql
        CREATE OR REPLACE FUNCTION filter_stations(
          lat float, lng float, radius_km float,
          fuel_type text DEFAULT NULL, max_price float DEFAULT NULL,
          has_availability boolean DEFAULT NULL, search_query text DEFAULT NULL
        )
        RETURNS TABLE(...) -- Define return columns
        LANGUAGE sql
        AS $$
          -- SQL implementation with all filters
        $$;
        ```
    *   [ ] **Reliability Score Logic:**
        *   Design algorithm for calculating station reliability.
        *   Implement as a SQL function or Supabase Edge Function.
        *   Create a scheduled function to periodically update reliability scores.
    *   [ ] **Data Aggregation:** Create SQL views or functions to aggregate data from `fuel_reports`.
    *   [ ] Implement a scheduled function to refresh Google-sourced data in your DB.
2.  **Frontend - Advanced Filtering & UI:**
    *   [✓] **Verify:** Basic `FilterBarComponent` already exists.
    *   [ ] **Enhance:** Expand `FilterBarComponent` to include all planned filters.
    *   [ ] Connect `FilterBarComponent` to NgRx store to update filter state and re-fetch stations.
    *   [✓] **Verify:** Basic `SearchBarComponent` exists.
    *   [ ] **Enhance:** Improve `SearchBarComponent` to trigger Supabase search or filter frontend results.
    *   [ ] Display reliability scores and aggregated fuel status on existing station components.
    *   [ ] Implement map marker clustering in `StationMapComponent` for better performance.
    *   [ ] Refine UI/UX: Improve visual cues, loading states, error handling, responsiveness.
    *   [✓] **Verify:** Basic `ToastComponent` exists.
    *   [ ] **Enhance:** Complete toast notification system for user feedback.
    *   [ ] Implement or enhance shared Pipes (`DistancePipe`, `TimeAgoPipe`, `CurrencyPipe`).
3.  **Admin Interface (Basic):**
    *   [ ] Create admin-only RLS policies in Supabase.
    *   [ ] Develop a simple web interface for admins to manage stations and potentially moderate reports (protected routes within the main app).

## Phase 6: Testing, Deployment & Iteration

**Goal:** Ensure application quality, deploy to production, and establish a process for ongoing maintenance and improvement.

**Steps:**

1.  **Testing:**
    *   [ ] **Frontend:** Write unit tests for components, services, NgRx stores.
    *   [ ] **Frontend:** Write E2E tests for critical user flows.
    *   [ ] **Supabase:** Test database functions, RLS policies, and Edge Functions.
2.  **CI/CD:**
    *   [ ] Set up CI/CD pipelines for automated building, testing, and deployment.
3.  **Deployment:**
    *   [ ] **Frontend:** Choose hosting solution (Vercel, Netlify, etc.) and deploy.
    *   [ ] **Supabase:** Ensure production project is properly configured with the same schema, functions, and policies.
    *   [ ] Configure domain name, SSL certificates.
4.  **Documentation:**
    *   [ ] Document Supabase schema, functions, and RLS policies.
    *   [ ] Document Edge Functions and their purposes.
5.  **Monitoring & Logging:**
    *   [ ] Set up Supabase monitoring and logging.
    *   [ ] Set up error tracking tools (e.g., Sentry).
6.  **Iteration & Feedback:**
    *   [ ] Gather user feedback.
    *   [ ] Plan and prioritize future features and improvements.
    *   [ ] Address bugs and performance issues.

This phased plan takes into account your existing project structure while leveraging Supabase to accelerate backend development. Adapt the tasks and their order based on your current progress and priorities. 