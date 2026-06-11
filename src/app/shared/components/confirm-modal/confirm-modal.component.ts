import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.component.html'
})
export class ConfirmModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Підтвердження';
  @Input() message = '';
  @Input() warning = '';
  @Input() alertMessage = '';
  @Input() confirmText = 'Видалити';
  @Input() confirmClass = 'btn-danger';
  @Input() headerClass = 'bg-danger text-white';
  @Input() submitting = false;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
