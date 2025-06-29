import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../store';
import { User } from '../../../core/models/user.model';
import { logout } from '../../../store/actions/user.actions';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="sticky top-0 z-50 bg-white border-b border-neutral-200">
      <div class="container mx-auto px-4">
        <div class="flex h-16 items-center justify-between gap-4">
          <!-- Logo -->
          <a routerLink="/" class="flex items-center gap-2">
            <span class="font-africa text-xl font-display font-bold text-primary-500">NaijaTank</span>
          </a>

          <!-- Navigation Links -->
          <div class="hidden md:flex items-center gap-6">
            <a routerLink="/map" routerLinkActive="nav-link-active" class="nav-link">
              Map
            </a>
            <a routerLink="/stations" routerLinkActive="nav-link-active" class="nav-link">
              Stations
            </a>
            <a routerLink="/report" class="btn btn-primary">
              Report Fuel
            </a>
          </div>

          <!-- User Menu -->
          <div class="flex items-center gap-4">
            <ng-container *ngIf="(isAuthenticated$ | async); else notAuth">
              <div class="relative" #profileMenu>
                <button 
                  (click)="toggleMenu()"
                  class="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-50 transition-colors duration-200">
                  <span class="hidden md:block text-sm font-medium text-neutral-700">
                    {{ (user$ | async)?.name ?? 'My Account' }}
                  </span>
                  <div class="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium">
                    {{ ((user$ | async)?.name ?? 'U').charAt(0).toUpperCase() }}
                  </div>
                </button>
                
                <div *ngIf="menuOpen" 
                     class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-50">
                  <a routerLink="/profile" 
                     class="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                    Profile
                  </a>
                  <a routerLink="/stations" 
                     class="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                    Saved Stations
                  </a>
                  <button 
                    (click)="onLogout()"
                    class="w-full flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                    Sign Out
                  </button>
                </div>
              </div>
            </ng-container>
            
            <ng-template #notAuth>
              <a routerLink="/auth" class="btn btn-secondary">
                Sign In
              </a>
            </ng-template>

            <!-- Mobile Menu Button -->
            <button 
              class="md:hidden p-2 rounded-lg hover:bg-neutral-50 transition-colors duration-200"
              (click)="toggleMenu()">
              <span class="sr-only">Menu</span>
              <div class="w-5 h-5 flex flex-col justify-center gap-1">
                <span class="block w-5 h-0.5 bg-neutral-600"></span>
                <span class="block w-5 h-0.5 bg-neutral-600"></span>
                <span class="block w-5 h-0.5 bg-neutral-600"></span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Navigation -->
      <div *ngIf="menuOpen" class="md:hidden border-t border-neutral-200">
        <div class="container mx-auto px-4 py-4 space-y-4">
          <a routerLink="/map" 
             routerLinkActive="nav-link-active"
             class="block nav-link py-2">
            Map
          </a>
          <a routerLink="/stations" 
             routerLinkActive="nav-link-active"
             class="block nav-link py-2">
            Stations
          </a>
          <a routerLink="/report" 
             class="btn btn-primary w-full justify-center">
            Report Fuel
          </a>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  isAuthenticated$: Observable<boolean>;
  user$: Observable<User | null>;
  menuOpen: boolean = false;
  
  constructor(private store: Store<AppState>) {
    this.isAuthenticated$ = this.store.select(state => state.user.isAuthenticated);
    this.user$ = this.store.select(state => state.user.user);
  }
  
  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }
  
  onLogout(): void {
    this.store.dispatch(logout());
    this.menuOpen = false;
  }
}