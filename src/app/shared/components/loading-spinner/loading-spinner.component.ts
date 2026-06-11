import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="text-center py-5 bg-white border rounded-3">
      <div class="spinner-border text-success" role="status">
        <span class="visually-hidden">Завантаження...</span>
      </div>
    </div>
  `
})
export class LoadingSpinnerComponent {}
