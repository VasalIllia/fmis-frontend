import { inject, PLATFORM_ID } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { map } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

export const nonAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // If already initialized, redirect to overview if authenticated
  if (authService.isInitialized()) {
    if (authService.isAuthenticated()) {
      return router.createUrlTree(['/overview']);
    } else {
      return true;
    }
  }

  // Otherwise wait for initialization and check authentication state
  return authService.initAuth().pipe(
    map(res => {
      if (res && res.userId) {
        return router.createUrlTree(['/overview']);
      }
      return true;
    })
  );
};
