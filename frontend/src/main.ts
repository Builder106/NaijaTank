import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

function bootstrapNaijaTankApp() {
  bootstrapApplication(AppComponent, appConfig)
    .catch(err => console.error(err));
}

// Attach to window for access from index.html
(window as any).bootstrapNaijaTankApp = bootstrapNaijaTankApp;