import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="bg-white border-t">
      <div class="container mx-auto px-4 py-6">
        <div class="text-center text-gray-600 text-sm">
          <p>&copy; {{ year }} NaijaTank. All rights reserved.</p>
          <p>Version: {{ version }}</p>
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {
  year: number = new Date().getFullYear();
  version = environment.appVersion;

  constructor() {}
}