import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './confirm-email.component.html'
})
export class ConfirmEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  isLoading = signal(true);
  isSuccess = signal(false);
  errorMessage = signal('');

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const userId = params['userId'];
      const code = params['code'];
      const changedEmail = params['changedEmail'];

      if (!userId || !code) {
        this.isLoading.set(false);
        this.errorMessage.set('Неправильне або відсутнє посилання для підтвердження.');
        return;
      }

      this.authService.confirmEmail(userId, code, changedEmail).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.isSuccess.set(true);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set('Помилка виконання запиту. Див. сповіщення.');
        }
      });
    });
  }
}
