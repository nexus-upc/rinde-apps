import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AccessLayout } from '@shared/access/access-layout/access-layout';
import { AutoFocus } from '@shared/forms/autofocus';
import { RiseTitle } from '@shared/ui/rise-title/rise-title';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import { matchingPasswords, PASSWORD_VALIDATORS } from '../../forms/password-validators';
import { AccessStore } from '../../state/access.store';

export type DefinePasswordMode = 'reset' | 'invitation';

const COPY: Readonly<
  Record<DefinePasswordMode, { title: string; lead: string; action: string; notice: string }>
> = {
  reset: {
    title: 'Crea una contraseña nueva',
    lead: 'La usarás desde ahora para iniciar sesión.',
    action: 'Guardar contraseña',
    notice: 'password',
  },
  invitation: {
    title: 'Únete a tu empresa',
    lead: 'Crea tu contraseña para activar la cuenta a la que te invitaron.',
    action: 'Activar mi cuenta',
    notice: 'invitation',
  },
};

/** Contraseña desde un enlace: recuperación (US10) o invitación de un usuario (US11). */
@Component({
  selector: 'app-define-password',
  providers: [AccessStore],
  imports: [AutoFocus, ReactiveFormsModule, RouterLink, AccessLayout, RiseTitle, UiButton],
  templateUrl: './define-password.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefinePassword {
  private readonly store = inject(AccessStore);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute).snapshot;

  protected readonly mode: DefinePasswordMode =
    this.route.data['mode'] === 'invitation' ? 'invitation' : 'reset';
  protected readonly copy = COPY[this.mode];
  protected readonly token = this.route.queryParamMap.get('token') ?? '';
  protected readonly form = this.fb.group(
    {
      password: this.fb.control('', PASSWORD_VALIDATORS),
      confirmation: this.fb.control('', [Validators.required]),
    },
    { validators: matchingPasswords },
  );
  protected readonly loading = this.store.request.pending;
  protected readonly errorMessage = this.store.request.error;

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.token) return;
    this.store.definePassword(this.token, this.form.controls.password.value, () => {
      void this.router.navigate(['/sign-in'], { queryParams: { notice: this.copy.notice } });
    });
  }

  protected passwordInvalid(): boolean {
    const control = this.form.controls.password;
    return control.touched && control.invalid;
  }

  protected confirmationInvalid(): boolean {
    const control = this.form.controls.confirmation;
    return control.touched && (control.invalid || this.form.hasError('mismatch'));
  }
}
