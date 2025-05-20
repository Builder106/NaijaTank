import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from './store';
import { TranslateService } from '@ngx-translate/core';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { initGeolocation } from './store/actions/geolocation.actions';

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
      <app-navbar></app-navbar>
      <main class="flex-grow">
        <router-outlet></router-outlet>
      </main>
      <app-footer></app-footer>
      <app-toast></app-toast>
    </div>
  `,
})
export class AppComponent implements OnInit {
  constructor(
    private store: Store<AppState>,
    private translate: TranslateService
  ) {
    // Set available languages
    translate.addLangs(['en', 'pidgin', 'yoruba', 'hausa', 'igbo']);
    
    // Set default language
    translate.setDefaultLang('en');
    
    // Use browser language if available, otherwise use default
    const browserLang = translate.getBrowserLang();
    translate.use(browserLang?.match(/en|pidgin|yoruba|hausa|igbo/) ? browserLang : 'en');
  }

  ngOnInit() {
    // Initialize geolocation
    this.store.dispatch(initGeolocation());
  }
}