import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Deja pasar solo a quien tiene sesión; los demás van a la pantalla de ingreso. */
export const authGuard: CanActivateFn = () => {
  if (inject(AuthService).getToken()) {
    return true;
  }
  return inject(Router).createUrlTree(['/sign-in']);
};
