import { Component, inject, signal, afterNextRender } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  isLoading = signal(false);
  errorMessage = signal('');
  hidePassword = signal(true);
  googleLoginUrl = signal<string>('');
  
  constructor() {
    afterNextRender(() => {
      const baseUrl = 'http://127.0.0.1:8082';
      const returnUrl = encodeURIComponent(`${window.location.origin}/auth/google-callback`);
      this.googleLoginUrl.set(`${baseUrl}/api/auth/google-login?returnUrl=${returnUrl}`);
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.loginForm.value;

    this.authService.login({ email: email!, password: password! }).subscribe({
      next: () => {
        this.authService.initAuth().subscribe({
          next: (res) => {
            this.isLoading.set(false);
            if (!res || !res.userId) {
              this.errorMessage.set('Сесія створена, але не вдалося отримати профіль. Оновіть сторінку.');
              return;
            }
            this.authService.redirectAfterAuth(res);
          },
          error: () => {
            this.isLoading.set(false);
            this.errorMessage.set('Помилка під час завантаження профілю. Спробуйте оновити сторінку.');
          }
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Помилка виконання запиту. Див. сповіщення.');
      }
    });
  }
}
