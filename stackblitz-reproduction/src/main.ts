import { bootstrapApplication } from '@angular/platform-browser';
import { Component } from '@angular/core';
import { HomeComponent } from './home.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HomeComponent],
  template: `<app-home></app-home>`,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class App {
  name = 'NaijaTank Minimal Home';
}

bootstrapApplication(App).catch(err => console.error(err)); 