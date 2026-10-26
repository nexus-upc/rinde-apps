import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { problemMessage } from '../../../core/http/problem-message';
import { IamApi } from '../../../core/iam/iam-api';
import { AccessLayout } from '../../../shared/access/access-layout/access-layout';
import { RiseTitle } from '../../../shared/ui/rise-title/rise-title';
import { UiButton } from '../../../shared/ui/ui-button/ui-button';

/** Confirmación del correo de la empresa desde el enlace que recibió el administrador (US08). */
@Component({
  selector: 'app-verify-email',
  imports: [RouterLink, AccessLayout, RiseTitle, UiButton],
  templateUrl: './verify-email.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmail {
  private readonly iam = inject(IamApi);
  private readonly router = inject(Router);
  private readonly query = inject(ActivatedRoute).snapshot.queryParamMap;

  protected readonly tenantId = this.query.get('tenant') ?? '';
  protected readonly token = this.query.get('token') ?? '';
  protected readonly validLink = this.tenantId !== '' && this.token !== '';
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected confirm(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.iam.verifyTenant(this.tenantId, this.token).subscribe({
      next: () => this.router.navigate(['/sign-in'], { queryParams: { notice: 'verified' } }),
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(problemMessage(error, 'No se pudo confirmar el correo. Intente nuevamente.'));
      },
    });
  }
}
