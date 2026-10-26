import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AccessLayout } from '@shared/access/access-layout/access-layout';
import { RiseTitle } from '@shared/ui/rise-title/rise-title';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import { AccessStore } from '../../state/access.store';

/** Confirmación del correo de la empresa desde el enlace que recibió el administrador (US08). */
@Component({
  selector: 'app-verify-email',
  providers: [AccessStore],
  imports: [RouterLink, AccessLayout, RiseTitle, UiButton],
  templateUrl: './verify-email.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmail {
  private readonly store = inject(AccessStore);
  private readonly router = inject(Router);
  private readonly query = inject(ActivatedRoute).snapshot.queryParamMap;

  protected readonly tenantId = this.query.get('tenant') ?? '';
  protected readonly token = this.query.get('token') ?? '';
  protected readonly validLink = this.tenantId !== '' && this.token !== '';
  protected readonly loading = this.store.request.pending;
  protected readonly errorMessage = this.store.request.error;

  protected confirm(): void {
    this.store.verify(this.tenantId, this.token, () => {
      void this.router.navigate(['/sign-in'], { queryParams: { notice: 'verified' } });
    });
  }
}
