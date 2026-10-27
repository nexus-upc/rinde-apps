import { DestroyRef, inject, Injectable } from '@angular/core';
import { RequestAction } from '@core/async/request-action';
import { AuthService } from '@core/auth/auth.service';
import { SignInRequest } from '@core/auth/auth.models';
import { tap } from 'rxjs';
import { PlatformApi } from '../data-access/platform-api';
@Injectable()
export class PlatformAccessStore {
  private readonly api = inject(PlatformApi);
  private readonly auth = inject(AuthService);
  readonly request = new RequestAction(inject(DestroyRef));
  signIn(credentials: SignInRequest, done: () => void) {
    this.request.run(
      this.api
        .signIn(credentials)
        .pipe(tap((response) => this.auth.establish(response, 'PLATFORM'))),
      {
        onSuccess: () => {
          done();
        },
        errorMessage: 'No se pudo acceder a la administración de Rinde.',
      },
    );
  }
}
