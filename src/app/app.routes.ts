import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'map',
    loadComponent: () => import('./features/map/map.component').then(m => m.MapComponent)
  },
  {
    path: 'stations',
    loadComponent: () => import('./features/stations/stations-list.component').then(m => m.StationsListComponent)
  },
  {
    path: 'stations/:id',
    loadComponent: () => import('./features/stations/station-detail.component').then(m => m.StationDetailComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/auth.component').then(m => m.AuthComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];