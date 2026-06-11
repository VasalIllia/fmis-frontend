import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  isLoading = signal(false);
  isSuccess = signal(false);
  errorMessage = signal('');

  onSubmit() {
    if (this.forgotForm.invalid) return;
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.forgotPassword({ email: this.forgotForm.value.email! }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isSuccess.set(true);
      },
      error: (err) => {
        this.isLoading.set(false);
        // Identity returns success even if email not found to prevent user enumeration
        // If there's a validation error, we show it
        this.errorMessage.set('Помилка виконання запиту. Див. сповіщення.');
      }
    });
  }
}
