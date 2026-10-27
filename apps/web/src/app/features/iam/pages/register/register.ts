import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AccessLayout } from '@shared/access/access-layout/access-layout';
import { AutoFocus } from '@shared/forms/autofocus';
import { RiseTitle } from '@shared/ui/rise-title/rise-title';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import { PASSWORD_VALIDATORS } from '../../forms/password-validators';
import { AccessStore } from '../../state/access.store';

type RegisterStep = 1 | 2 | 3 | 4 | 'sent';

/** Campos que se validan en cada paso antes de avanzar. */
const STEP_FIELDS = {
  1: ['tradeName', 'ruc'],
  2: ['administratorFullName'],
  3: ['administratorEmail'],
  4: ['password'],
} as const;

/** Registro de la empresa (US08), una pregunta por pantalla como en Arcadia. */
@Component({
  selector: 'app-register',
  providers: [AccessStore],
  imports: [AutoFocus, ReactiveFormsModule, RouterLink, AccessLayout, RiseTitle, UiButton],
  templateUrl: './register.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
  private readonly store = inject(AccessStore);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
    tradeName: this.fb.control('', [Validators.required, Validators.maxLength(120)]),
    ruc: this.fb.control('', [Validators.required, Validators.pattern(/^\d{11}$/)]),
    administratorFullName: this.fb.control('', [Validators.required, Validators.maxLength(150)]),
    administratorEmail: this.fb.control('', [
      Validators.required,
      Validators.email,
      Validators.maxLength(150),
    ]),
    password: this.fb.control('', PASSWORD_VALIDATORS),
  });

  protected readonly step = signal<RegisterStep>(1);
  protected readonly loading = this.store.request.pending;
  protected readonly errorMessage = this.store.request.error;
  /** Primer nombre para el saludo del paso del correo. */
  protected readonly firstName = signal('');
  protected readonly stepNumber = computed(() => {
    const step = this.step();
    return step === 'sent' ? 4 : step;
  });

  protected next(): void {
    if (this.loading()) return;
    const step = this.step();
    if (step === 'sent') {
      return;
    }
    const fields = STEP_FIELDS[step];
    const invalid = fields.filter((name) => this.form.controls[name].invalid);
    if (invalid.length > 0) {
      fields.forEach((name) => this.form.controls[name].markAsTouched());
      return;
    }
    if (step === 2) {
      this.firstName.set(
        this.form.controls.administratorFullName.value.trim().split(/\s+/)[0] ?? '',
      );
    }
    if (step === 4) {
      this.submit();
      return;
    }
    this.goTo((step + 1) as RegisterStep);
  }

  protected back(): void {
    const step = this.step();
    if (step !== 'sent' && step > 1) {
      this.store.request.clearError();
      this.goTo((step - 1) as RegisterStep);
    }
  }

  protected isInvalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.touched && control.invalid;
  }

  private submit(): void {
    const value = this.form.getRawValue();
    this.store.register(
      {
        ...value,
        tradeName: value.tradeName.trim(),
        administratorFullName: value.administratorFullName.trim(),
        administratorEmail: value.administratorEmail.trim(),
      },
      () => this.step.set('sent'),
    );
  }

  private goTo(step: RegisterStep): void {
    this.step.set(step);
  }
}
