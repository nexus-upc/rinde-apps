import { afterNextRender, ChangeDetectionStrategy, Component, inject, Injector, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { problemMessage } from '../../../core/http/problem-message';
import { AccessLayout } from '../../../shared/access/access-layout/access-layout';
import { MailIcon } from '../../../shared/ui/icons/mail-icon';
import { RiseTitle } from '../../../shared/ui/rise-title/rise-title';
import { UiButton } from '../../../shared/ui/ui-button/ui-button';

const GENERIC_ERROR = 'No se pudo iniciar sesión. Intente nuevamente.';

/** Avisos que otras pantallas del acceso dejan al volver al ingreso. */
const NOTICES: Readonly<Record<string, string>> = {
  verified: 'Tu empresa quedó activa. Ya puedes iniciar sesión.',
  password: 'Tu contraseña quedó lista. Ya puedes iniciar sesión.',
  invitation: 'Tu cuenta quedó activa. Ya puedes iniciar sesión.',
};

/** Pantalla de ingreso por pasos, como Arcadia: elegir el método, luego el correo y la contraseña. */
@Component({
  selector: 'app-sign-in',
  imports: [ReactiveFormsModule, RouterLink, AccessLayout, MailIcon, RiseTitle, UiButton],
  templateUrl: './sign-in.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignIn {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly injector = inject(Injector);
  private readonly query = inject(ActivatedRoute).snapshot.queryParamMap;

  protected readonly form = this.fb.group({
    email: this.fb.control(this.query.get('email') ?? '', [Validators.required, Validators.email]),
    password: this.fb.control('', [Validators.required]),
  });

  protected readonly step = signal<'start' | 'email' | 'password'>('start');
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly notice = signal<string | null>(NOTICES[this.query.get('notice') ?? ''] ?? null);

  protected goToEmail(): void {
    this.step.set('email');
    this.focusAfterRender('email');
  }

  protected backToStart(): void {
    this.form.controls.email.markAsUntouched();
    this.step.set('start');
  }

  protected continueWithEmail(): void {
    const email = this.form.controls.email;
    if (email.invalid) {
      email.markAsTouched();
      return;
    }
    this.errorMessage.set(null);
    this.step.set('password');
    this.focusAfterRender('password');
  }

  protected changeEmail(): void {
    this.form.controls.password.reset();
    this.errorMessage.set(null);
    this.step.set('email');
    this.focusAfterRender('email');
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);
    this.auth.signIn(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/trips'),
      error: (error: unknown) => {
        this.errorMessage.set(problemMessage(error, GENERIC_ERROR));
        this.loading.set(false);
      },
    });
  }

  protected isInvalid(field: 'email' | 'password'): boolean {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }

  /** El paso se vuelve a montar, así que el foco se pone después de dibujarlo. */
  private focusAfterRender(id: 'email' | 'password'): void {
    afterNextRender(() => document.getElementById(id)?.focus(), { injector: this.injector });
  }
}
