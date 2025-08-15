import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/components/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'map',
    loadComponent: () => import('./features/stations/components/station-map/station-map.component').then(m => m.StationMapComponent)
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
    loadComponent: () => import('./features/user/profile.component').then(m => m.ProfileComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];