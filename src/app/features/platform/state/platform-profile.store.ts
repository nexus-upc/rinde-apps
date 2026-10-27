import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { RequestAction } from '@core/async/request-action';
import { PlatformApi } from '../data-access/platform-api';
import { PlatformProfile } from '../models/platform.models';
@Injectable()
export class PlatformProfileStore {
  private readonly api = inject(PlatformApi);
  private readonly profileState = signal<PlatformProfile | null>(null);
  readonly profile = this.profileState.asReadonly();
  readonly request = new RequestAction(inject(DestroyRef));
  load() {
    this.request.run(this.api.profile(), {
      onSuccess: (value) => this.profileState.set(value),
      errorMessage: 'No se pudo cargar tu perfil.',
    });
  }
}
