import { Injectable, effect, inject, signal } from '@angular/core';
import { AuthService } from '@core/auth/auth.service';
import { IamApi } from '../data-access/iam-api';
import { CurrentUser } from '../models/iam.models';

/** El perfil sigue al token de sesión; al cerrar sesión se cancela la consulta y se limpia. */
@Injectable({ providedIn: 'root' })
export class SessionProfileStore {
  private readonly auth = inject(AuthService);
  private readonly iam = inject(IamApi);
  private readonly profileState = signal<CurrentUser | null>(null);
  readonly profile = this.profileState.asReadonly();

  constructor() {
    effect((onCleanup) => {
      const token = this.auth.accessToken();
      this.profileState.set(null);
      if (!token || this.auth.user()?.scope === 'PLATFORM') return;
      const request = this.iam.currentUser().subscribe({
        next: (profile) => this.profileState.set(profile),
        error: () => this.profileState.set(null),
      });
      onCleanup(() => request.unsubscribe());
    });
  }
}
