import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { FarmService } from '../../../core/farm/farm.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-farm-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './farm-create.component.html'
})
export class FarmCreateComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private farmService = inject(FarmService);

  farmForm = this.fb.group({
    name: ['', Validators.required]
  });

  isLoading = signal(false);
  errorMessage = signal('');

  onSubmit() {
    if (this.farmForm.invalid) return;
    this.isLoading.set(true);
    this.errorMessage.set('');

    const name = this.farmForm.value.name!.trim();
    if (!name) {
      this.isLoading.set(false);
      this.errorMessage.set('Назва ферми обов\'язкова.');
      return;
    }

    this.farmService.createFarm({ name }).subscribe({
      next: () => {
        // Now fetch auth state again so the backend issues a new cookie with farm_id claim
        this.authService.initAuth().subscribe({
          next: (res) => {
            this.isLoading.set(false);
            if (res?.farmId) {
              this.authService.redirectAfterAuth(res);
            } else {
              this.errorMessage.set('Ферму створено. Перейдіть на головну сторінку та оновіть сесію входу.');
            }
          },
          error: (err) => {
            this.isLoading.set(false);
            this.errorMessage.set('Помилка виконання запиту. Див. сповіщення.');
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
