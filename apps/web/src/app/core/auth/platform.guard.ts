import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
export const platformGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (!auth.getToken())
    return inject(Router).createUrlTree(['/platform/sign-in'], {
      queryParams:
        state.url === '/platform/mailbox' ? { returnUrl: '/platform/mailbox' } : undefined,
    });
  return auth.user()?.scope === 'PLATFORM' ? true : inject(Router).createUrlTree(['/trips']);
};
