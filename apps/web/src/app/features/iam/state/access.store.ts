import { DestroyRef, Injectable, inject } from '@angular/core';
import { RequestAction } from '@core/async/request-action';
import { SignInRequest } from '@core/auth/auth.models';
import { AuthService } from '@core/auth/auth.service';
import { IamApi } from '../data-access/iam-api';
import { RegisterTenantRequest } from '../models/iam.models';

/** Una instancia por pantalla de acceso; la navegación y los formularios pertenecen a la página. */
@Injectable()
export class AccessStore {
  private readonly iam = inject(IamApi);
  private readonly auth = inject(AuthService);
  readonly request = new RequestAction(inject(DestroyRef));

  signIn(credentials: SignInRequest, done: () => void): void {
    this.request.run(this.auth.signIn(credentials), {
      onSuccess: done,
      errorMessage: 'No se pudo iniciar sesión. Intente nuevamente.',
    });
  }
  register(request: RegisterTenantRequest, done: () => void): void {
    this.request.run(this.iam.registerTenant(request), {
      onSuccess: done,
      errorMessage: 'No se pudo registrar la empresa. Intente nuevamente.',
    });
  }
  recover(email: string, done: () => void): void {
    this.request.run(this.iam.requestPasswordReset(email), {
      onSuccess: done,
      errorMessage: 'No se pudo enviar el enlace. Intente nuevamente.',
    });
  }
  definePassword(token: string, password: string, done: () => void): void {
    this.request.run(this.iam.definePassword(token, password), {
      onSuccess: done,
      errorMessage: 'No se pudo guardar la contraseña. Intente nuevamente.',
    });
  }
  verify(tenantId: string, token: string, done: () => void): void {
    if (!tenantId || !token) return;
    this.request.run(this.iam.verifyTenant(tenantId, token), {
      onSuccess: done,
      errorMessage: 'No se pudo confirmar el correo. Intente nuevamente.',
    });
  }
}
