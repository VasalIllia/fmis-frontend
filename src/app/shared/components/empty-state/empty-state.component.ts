import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.component.html'
})
export class EmptyStateComponent {
  @Input() icon = 'bi-inbox';
  @Input() title = 'Нічого не знайдено';
  @Input() message = '';
  @Input() actionLabel = '';
  @Output() action = new EventEmitter<void>();

  onAction(): void {
    this.action.emit();
  }
}
