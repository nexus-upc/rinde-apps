import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { BrandMark } from '../../../shared/brand/brand-mark/brand-mark';
import { isWideScreen } from '../../../shared/layout/wide-screen';
import { EntrancePreview } from './entrance-preview/entrance-preview';

const CONNECTION_ERROR = 'No se pudo conectar con el servidor. Intente nuevamente.';
const GENERIC_ERROR = 'No se pudo iniciar sesión. Intente nuevamente.';

/** Pantalla de ingreso: correo y contraseña contra el gateway, y luego al tablero de viajes. */
@Component({
  selector: 'app-sign-in',
  imports: [ReactiveFormsModule, BrandMark, EntrancePreview],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignIn {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
    email: this.fb.control('', [Validators.required, Validators.email]),
    password: this.fb.control('', [Validators.required]),
  });

  /** Desde 1100 px la pantalla tiene dos columnas y muestra la vista decorativa. */
  protected readonly wide = isWideScreen();
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

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
