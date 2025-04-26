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
    <nav class="bg-white shadow-md">
      <div class="container mx-auto px-4">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <a routerLink="/" class="flex items-center">
              <span class="text-primary-500 font-bold text-xl">NaijaTank</span>
            </a>
          </div>
          
          <div class="flex items-center gap-4">
            <a routerLink="/report" class="text-sm font-medium text-gray-700 hover:text-primary-500">
              Report Fuel
            </a>
            
            <ng-container *ngIf="(isAuthenticated$ | async); else notAuth">
              <div class="relative" #profileMenu>
                <button 
                  (click)="toggleMenu()"
                  class="flex items-center text-sm font-medium text-gray-700 hover:text-primary-500">
                  <span class="hidden md:block mr-2">{{ (user$ | async)?.name || 'My Account' }}</span>
                  <div class="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
                    {{ (user$ | async)?.name?.charAt(0).toUpperCase() || 'U' }}
                  </div>
                </button>
                
                <div *ngIf="menuOpen" class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <a routerLink="/profile" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary-500">
                    My Profile
                  </a>
                  <a routerLink="/stations" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary-500">
                    Saved Stations
                  </a>
                  <button 
                    (click)="onLogout()"
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary-500">
                    Sign Out
                  </button>
                </div>
              </div>
            </ng-container>
            
            <ng-template #notAuth>
              <a routerLink="/auth" class="text-sm font-medium text-gray-700 hover:text-primary-500">
                Sign In
              </a>
            </ng-template>
          </div>
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