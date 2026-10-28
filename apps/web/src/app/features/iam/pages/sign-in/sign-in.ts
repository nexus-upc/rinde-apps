import {
  AnimationCallbackEvent,
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { WorkspaceTransition } from '@core/loading/workspace-transition';
import { AccessLayout } from '@shared/access/access-layout/access-layout';
import { AutoFocus } from '@shared/forms/autofocus';
import { leaveStep } from '@shared/motion/leave-step';
import { MailIcon } from '@shared/ui/icons/mail-icon';
import { RiseTitle } from '@shared/ui/rise-title/rise-title';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import { AccessStore } from '../../state/access.store';

/** Avisos que otras pantallas del acceso dejan al volver al ingreso. */
const NOTICES: Readonly<Record<string, string>> = {
  verified: 'Tu empresa quedó activa. Ya puedes iniciar sesión.',
  password: 'Tu contraseña quedó lista. Ya puedes iniciar sesión.',
  invitation: 'Tu cuenta quedó activa. Ya puedes iniciar sesión.',
};

/** Pantalla de ingreso por pasos, como Arcadia: elegir el método, luego el correo y la contraseña. */
@Component({
  selector: 'app-sign-in',
  providers: [AccessStore],
  imports: [
    AutoFocus,
    ReactiveFormsModule,
    RouterLink,
    AccessLayout,
    MailIcon,
    RiseTitle,
    UiButton,
  ],
  templateUrl: './sign-in.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignIn {
  private readonly store = inject(AccessStore);
  private readonly transition = inject(WorkspaceTransition);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly query = inject(ActivatedRoute).snapshot.queryParamMap;

  protected readonly form = this.fb.group({
    email: this.fb.control(this.query.get('email') ?? '', [Validators.required, Validators.email]),
    password: this.fb.control('', [Validators.required]),
  });

  protected readonly step = signal<'start' | 'email' | 'password'>('start');
  protected readonly loading = this.store.request.pending;
  protected readonly errorMessage = this.store.request.error;
  protected readonly notice = signal<string | null>(
    NOTICES[this.query.get('notice') ?? ''] ?? null,
  );

  protected leave(event: AnimationCallbackEvent): void {
    leaveStep(event);
  }

  protected goToEmail(): void {
    this.step.set('email');
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
    this.store.request.clearError();
    this.step.set('password');
  }

  protected changeEmail(): void {
    this.form.controls.password.reset();
    this.store.request.clearError();
    this.step.set('email');
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.store.signIn(this.form.getRawValue(), () => {
      void this.transition.enter('/home');
    });
  }

  protected isInvalid(field: 'email' | 'password'): boolean {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }
}
