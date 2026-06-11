import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { DialogRef } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password-dialog.component.html'
})
export class ChangePasswordDialogComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  public dialogRef = inject(DialogRef);

  passwordForm = this.fb.group({
    oldPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  isLoading = signal(false);
  errorMessage = signal('');

  hideOld = signal(true);
  hideNew = signal(true);
  hideConfirm = signal(true);

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const p = control.get('newPassword')?.value;
    const cp = control.get('confirmPassword')?.value;
    return p === cp ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.passwordForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const formVal = this.passwordForm.value;

    this.authService.updateInfo({
      oldPassword: formVal.oldPassword!,
      newPassword: formVal.newPassword!
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.dialogRef.close();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Помилка виконання запиту. Див. сповіщення.');
      }
    });
  }
}
