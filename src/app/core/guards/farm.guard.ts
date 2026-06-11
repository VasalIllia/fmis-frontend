import { inject, PLATFORM_ID } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { map } from 'rxjs';

import { isPlatformBrowser } from '@angular/common';

export const farmGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  if (authService.isInitialized()) {
    if (authService.isAuthenticated()) {
      if (authService.farmId()) {
        return true;
      } else {
        return router.createUrlTree(['/overview']);
      }
    } else {
      return router.createUrlTree(['/auth/login']);
    }
  }

  return authService.initAuth().pipe(
    map(res => {
      if (res && res.userId) {
        if (res.farmId) {
          return true;
        } else {
          return router.createUrlTree(['/overview']);
        }
      }
      return router.createUrlTree(['/auth/login']);
    })
  );
};
