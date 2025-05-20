import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="bg-white border-t">
      <div class="container mx-auto px-4 py-6">
        <div class="text-center text-gray-600 text-sm">
          <p>&copy; 2025 NaijaTank. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {}