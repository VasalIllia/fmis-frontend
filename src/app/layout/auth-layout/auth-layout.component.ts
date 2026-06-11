import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './auth-layout.component.html',
  })
export class AuthLayoutComponent {
  private router = inject(Router);

  showToggle(): boolean {
    const url = this.router.url;
    return url.includes('/auth/login') || url.includes('/auth/register');
  }
}
