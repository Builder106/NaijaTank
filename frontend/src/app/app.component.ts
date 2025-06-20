import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter } from 'rxjs/operators';
import { AppState } from './store';
import { TranslateService } from '@ngx-translate/core';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { initGeolocation } from './store/actions/geolocation.actions';
import * as AuthActions from './store/actions/auth.actions';
import { inject } from '@vercel/analytics';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    ToastComponent
  ],
  template: `
    <div class="flex flex-col min-h-screen">
      <app-navbar *ngIf="!isHomePage"></app-navbar>
      <main class="flex-grow">
        <router-outlet></router-outlet>
      </main>
      <app-footer *ngIf="!isHomePage"></app-footer>
      <app-toast></app-toast>
    </div>
  `,
})
export class AppComponent implements OnInit {
  isHomePage = false;

  constructor(
    private store: Store<AppState>,
    private translate: TranslateService,
    private router: Router
  ) {
    // Set available languages
    translate.addLangs(['en', 'pidgin', 'yoruba', 'hausa', 'igbo']);
    
    // Set default language
    translate.setDefaultLang('en');
    
    // Use browser language if available, otherwise use default
    const browserLang = translate.getBrowserLang();
    translate.use(browserLang?.match(/en|pidgin|yoruba|hausa|igbo/) ? browserLang : 'en');

    // Listen to route changes to determine if we're on the home page
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.isHomePage = event.url === '/' || event.url === '/home';
    });

    // Set initial state
    this.isHomePage = this.router.url === '/' || this.router.url === '/home';
  }

  ngOnInit() {
    // Initialize Vercel Analytics
    inject();
    // Initialize geolocation
    this.store.dispatch(initGeolocation());
    // Check for existing auth session on app load
    this.store.dispatch(AuthActions.checkAuthSession());
  }
}