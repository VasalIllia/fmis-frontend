import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  resetForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    resetCode: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  isLoading = signal(false);
  isSuccess = signal(false);
  errorMessage = signal('');
  
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      const email = params['email'];
      if (code) {
        this.resetForm.patchValue({ resetCode: code });
      }
      if (email) {
        this.resetForm.patchValue({ email: email });
      }
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const p = control.get('newPassword')?.value;
    const cp = control.get('confirmPassword')?.value;
    return p === cp ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.resetForm.invalid) return;
    this.isLoading.set(true);
    this.errorMessage.set('');

    const formVal = this.resetForm.value;
    this.authService.resetPassword({
      email: formVal.email!,
      resetCode: formVal.resetCode!,
      newPassword: formVal.newPassword!
    }).subscribe({
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
}
