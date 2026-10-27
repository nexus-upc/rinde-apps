import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** La gestión de usuarios es solo del administrador; el backend también lo valida. */
export const adminGuard: CanActivateFn = () => {
  if (inject(AuthService).user()?.role === 'ADMINISTRATOR') {
    return true;
  }
  return inject(Router).createUrlTree(['/trips']);
};
