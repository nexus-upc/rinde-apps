import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { RequestAction } from '../async/request-action';
import { DemoConfigApi } from './data-access/demo-config-api';
/** Disponibilidad pública del modo, sin acceso a destinatarios ni enlaces. */
@Injectable({ providedIn: 'root' })
export class DemoModeService {
  private readonly api = inject(DemoConfigApi);
  private readonly readyState = signal(false);
  private readonly mailboxState = signal(false);
  readonly ready = this.readyState.asReadonly();
  readonly mailboxEnabled = this.mailboxState.asReadonly();
  readonly request = new RequestAction(inject(DestroyRef));
  load() {
    this.request.run(this.api.features(), {
      onSuccess: (features) => {
        this.mailboxState.set(features.mailboxEnabled === true);
        this.readyState.set(true);
      },
      onError: () => {
        this.mailboxState.set(false);
        this.readyState.set(true);
      },
      errorMessage: 'No se pudo comprobar el modo de demostración.',
    });
  }
}
