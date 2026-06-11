import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  isLoading = signal(false);
  isResending = signal(false);
  errorMessage = signal('');
  isSuccess = signal(false);
  
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.registerForm.value;

    this.authService.register({ email: email!, password: password! }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isSuccess.set(true);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Помилка виконання запиту. Див. сповіщення.');
      }
    });
  }

  resendEmail() {
    const email = this.registerForm.value.email;
    if (!email) return;

    this.isResending.set(true);
    this.authService.resendConfirmationEmail(email).subscribe({
      next: () => {
        this.isResending.set(false);
      },
      error: () => {
        this.isResending.set(false);
      }
    });
  }
}
