import { afterNextRender, ChangeDetectionStrategy, Component, inject, Injector, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { problemMessage } from '../../../core/http/problem-message';
import { IamApi } from '../../../core/iam/iam-api';
import { AccessLayout } from '../../../shared/access/access-layout/access-layout';
import { RiseTitle } from '../../../shared/ui/rise-title/rise-title';
import { UiButton } from '../../../shared/ui/ui-button/ui-button';

export type DefinePasswordMode = 'reset' | 'invitation';

const COPY: Readonly<Record<DefinePasswordMode, { title: string; lead: string; action: string; notice: string }>> = {
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

/** Las dos contraseñas deben coincidir. */
function matchingPasswords(group: AbstractControl): ValidationErrors | null {
  const { password, confirmation } = group.value as { password: string; confirmation: string };
  return confirmation !== '' && password !== confirmation ? { mismatch: true } : null;
}

/** Contraseña desde un enlace: recuperación (US10) o invitación de un usuario (US11). */
@Component({
  selector: 'app-define-password',
  imports: [ReactiveFormsModule, RouterLink, AccessLayout, RiseTitle, UiButton],
  templateUrl: './define-password.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefinePassword {
  private readonly iam = inject(IamApi);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute).snapshot;

  protected readonly mode: DefinePasswordMode = this.route.data['mode'] === 'invitation' ? 'invitation' : 'reset';
  protected readonly copy = COPY[this.mode];
  protected readonly token = this.route.queryParamMap.get('token') ?? '';
  protected readonly form = this.fb.group(
    {
      password: this.fb.control('', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]),
      confirmation: this.fb.control('', [Validators.required]),
    },
    { validators: matchingPasswords },
  );
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    afterNextRender(() => document.getElementById('password')?.focus(), { injector: inject(Injector) });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);
    this.iam.definePassword(this.token, this.form.controls.password.value).subscribe({
      next: () => this.router.navigate(['/sign-in'], { queryParams: { notice: this.copy.notice } }),
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(problemMessage(error, 'No se pudo guardar la contraseña. Intente nuevamente.'));
      },
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
