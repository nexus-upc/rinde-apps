import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
export const platformGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (!auth.getToken()) return inject(Router).createUrlTree(['/platform/sign-in']);
  return auth.user()?.scope === 'PLATFORM' ? true : inject(Router).createUrlTree(['/trips']);
};
