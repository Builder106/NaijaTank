import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex justify-center items-center">
      <div class="loader"></div>
    </div>
  `
})
export class LoaderComponent {}