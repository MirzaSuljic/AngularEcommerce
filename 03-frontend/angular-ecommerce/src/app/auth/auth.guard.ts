import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

/** Lets logged in users through; everyone else goes to /login and comes back afterwards. */
export const authGuard: CanActivateFn = (_route, state) => {
  if (inject(AuthService).isAuthenticated()) {
    return true;
  }
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Only users with ROLE_ADMIN; others are sent to login (or home if already logged in). */
export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAdmin()) {
    return true;
  }
  if (auth.isAuthenticated()) {
    return router.createUrlTree(['/settings']);
  }
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
