import { afterNextRender, ChangeDetectionStrategy, Component, inject, Injector, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { problemMessage } from '../../../core/http/problem-message';
import { IamApi } from '../../../core/iam/iam-api';
import { AccessLayout } from '../../../shared/access/access-layout/access-layout';
import { RiseTitle } from '../../../shared/ui/rise-title/rise-title';
import { UiButton } from '../../../shared/ui/ui-button/ui-button';

/** Pedido del enlace de recuperación (US10). La respuesta no revela si el correo existe. */
@Component({
  selector: 'app-recover',
  imports: [ReactiveFormsModule, RouterLink, AccessLayout, RiseTitle, UiButton],
  templateUrl: './recover.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Recover {
  private readonly iam = inject(IamApi);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
    email: this.fb.control(inject(ActivatedRoute).snapshot.queryParamMap.get('email') ?? '', [
      Validators.required,
      Validators.email,
      Validators.maxLength(150),
    ]),
  });
  protected readonly sent = signal(false);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    afterNextRender(() => document.getElementById('email')?.focus(), { injector: inject(Injector) });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);
    this.iam.requestPasswordReset(this.form.controls.email.value.trim()).subscribe({
      next: () => {
        this.loading.set(false);
        this.sent.set(true);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(problemMessage(error, 'No se pudo enviar el enlace. Intente nuevamente.'));
      },
    });
  }

  protected isInvalid(): boolean {
    const control = this.form.controls.email;
    return control.touched && control.invalid;
  }
}
