import { inject, PLATFORM_ID } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { map } from 'rxjs';

import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // If already initialized, just check
  if (authService.isInitialized()) {
    if (authService.isAuthenticated()) {
      return true;
    } else {
      return router.createUrlTree(['/auth/login']);
    }
  }

  // Otherwise wait for init
  return authService.initAuth().pipe(
    map(res => {
      if (res && res.userId) {
        return true;
      }
      return router.createUrlTree(['/auth/login']);
    })
  );
};
