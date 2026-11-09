import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { OPERATION_ROLES } from './auth.models';
import { AuthService } from './auth.service';

/** Operación es del administrador y del responsable de operaciones; el backend también lo valida. */
export const operationsGuard: CanActivateFn = () => {
  const role = inject(AuthService).user()?.role ?? '';
  if (OPERATION_ROLES.includes(role)) {
    return true;
  }
  return inject(Router).createUrlTree(['/home']);
};
