import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, ChangeDetectionStrategy, Component, inject, Injector, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { BrandMark } from '../../../shared/brand/brand-mark/brand-mark';
import { isWideScreen } from '../../../shared/layout/wide-screen';
import { RiseTitle } from '../../../shared/ui/rise-title/rise-title';
import { UiButton } from '../../../shared/ui/ui-button/ui-button';
import { EntrancePreview } from './entrance-preview/entrance-preview';

const CONNECTION_ERROR = 'No se pudo conectar con el servidor. Intente nuevamente.';
const GENERIC_ERROR = 'No se pudo iniciar sesión. Intente nuevamente.';

/** Pantalla de ingreso en dos pasos, como Arcadia: primero el correo y luego la contraseña. */
@Component({
  selector: 'app-sign-in',
  imports: [ReactiveFormsModule, BrandMark, EntrancePreview, RiseTitle, UiButton],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignIn {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly injector = inject(Injector);

  protected readonly form = this.fb.group({
    email: this.fb.control('', [Validators.required, Validators.email]),
    password: this.fb.control('', [Validators.required]),
  });

  /** Desde 1100 px la pantalla tiene dos columnas y muestra la vista decorativa. */
  protected readonly wide = isWideScreen();
  protected readonly step = signal<'email' | 'password'>('email');
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

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

  /** El paso se vuelve a montar, así que el foco se pone después de dibujarlo. */
  private focusAfterRender(id: 'email' | 'password'): void {
    afterNextRender(() => document.getElementById(id)?.focus(), { injector: this.injector });
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
        this.errorMessage.set(this.messageFor(error));
        this.loading.set(false);
      },
    });
  }

  protected isInvalid(field: 'email' | 'password'): boolean {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }

  /** Usa el detail del ProblemDetails del backend; sin él, un mensaje general. */
  private messageFor(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return GENERIC_ERROR;
    }
    const detail = (error.error as { detail?: unknown } | null)?.detail;
    if (typeof detail === 'string' && detail.trim() !== '') {
      return detail;
    }
    return error.status === 0 ? CONNECTION_ERROR : GENERIC_ERROR;
  }
}
