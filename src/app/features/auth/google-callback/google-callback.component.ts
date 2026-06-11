import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-google-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './google-callback.component.html'
})
export class GoogleCallbackComponent implements OnInit {
  private authService = inject(AuthService);

  ngOnInit() {
    // We arrive here after Google login redirects back.
    // The backend should have already set the cookie if successful.
    // We just need to check if we are authenticated.
    this.authService.initAuth().subscribe({
      next: (res) => {
        this.authService.redirectAfterAuth(res);
      }
    });
  }
}
