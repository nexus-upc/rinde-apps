import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AccessLayout } from '@shared/access/access-layout/access-layout';
import { AutoFocus } from '@shared/forms/autofocus';
import { RiseTitle } from '@shared/ui/rise-title/rise-title';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import { AccessStore } from '../../state/access.store';

/** Pedido del enlace de recuperación (US10). La respuesta no revela si el correo existe. */
@Component({
  selector: 'app-recover',
  providers: [AccessStore],
  imports: [AutoFocus, ReactiveFormsModule, RouterLink, AccessLayout, RiseTitle, UiButton],
  templateUrl: './recover.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Recover {
  private readonly store = inject(AccessStore);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
    email: this.fb.control(inject(ActivatedRoute).snapshot.queryParamMap.get('email') ?? '', [
      Validators.required,
      Validators.email,
      Validators.maxLength(150),
    ]),
  });
  protected readonly sent = signal(false);
  protected readonly loading = this.store.request.pending;
  protected readonly errorMessage = this.store.request.error;

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.store.recover(this.form.controls.email.value.trim(), () => this.sent.set(true));
  }

  protected isInvalid(): boolean {
    const control = this.form.controls.email;
    return control.touched && control.invalid;
  }
}
