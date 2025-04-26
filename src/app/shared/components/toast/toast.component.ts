import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="(toast$ | async)?.visible" 
         class="fixed bottom-4 right-4 z-50 max-w-md"
         [ngClass]="{
           'bg-success-500': (toast$ | async)?.type === 'success',
           'bg-warning-500': (toast$ | async)?.type === 'warning',
           'bg-error-500': (toast$ | async)?.type === 'error',
           'bg-primary-500': (toast$ | async)?.type === 'info'
         }">
      <div class="flex items-center p-4 text-white rounded-lg shadow-lg">
        <p class="flex-1">{{ (toast$ | async)?.message }}</p>
        <button 
          (click)="hideToast()"
          class="ml-4 p-1 hover:bg-white hover:bg-opacity-20 rounded-full">
          <span class="sr-only">Close</span>
          <span class="block w-5 h-5 text-white" aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  `
})
export class ToastComponent {
  toast$ = this.store.select(state => state.ui.toast);

  constructor(private store: Store<AppState>) {}

  hideToast(): void {
    this.store.dispatch({ type: '[UI] Hide Toast' });
  }
}