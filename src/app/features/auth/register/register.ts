import { afterNextRender, ChangeDetectionStrategy, Component, computed, inject, Injector, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { problemMessage } from '../../../core/http/problem-message';
import { IamApi } from '../../../core/iam/iam-api';
import { AccessLayout } from '../../../shared/access/access-layout/access-layout';
import { RiseTitle } from '../../../shared/ui/rise-title/rise-title';
import { UiButton } from '../../../shared/ui/ui-button/ui-button';

type RegisterStep = 1 | 2 | 3 | 4 | 'sent';

/** Campos que se validan en cada paso antes de avanzar. */
const STEP_FIELDS = {
  1: ['tradeName', 'ruc'],
  2: ['administratorFullName'],
  3: ['administratorEmail'],
  4: ['password'],
} as const;

/** Primer campo de cada paso, para ponerle el foco al llegar. */
const FIRST_FIELD: Readonly<Record<number, string>> = {
  1: 'tradeName',
  2: 'administratorFullName',
  3: 'administratorEmail',
  4: 'password',
};

/** Registro de la empresa (US08), una pregunta por pantalla como en Arcadia. */
@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, AccessLayout, RiseTitle, UiButton],
  templateUrl: './register.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
  private readonly iam = inject(IamApi);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly injector = inject(Injector);

  protected readonly form = this.fb.group({
    tradeName: this.fb.control('', [Validators.required, Validators.maxLength(120)]),
    ruc: this.fb.control('', [Validators.required, Validators.pattern(/^\d{11}$/)]),
    administratorFullName: this.fb.control('', [Validators.required, Validators.maxLength(150)]),
    administratorEmail: this.fb.control('', [Validators.required, Validators.email, Validators.maxLength(150)]),
    password: this.fb.control('', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]),
  });

  protected readonly step = signal<RegisterStep>(1);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  /** Primer nombre para el saludo del paso del correo. */
  protected readonly firstName = signal('');
  protected readonly stepNumber = computed(() => {
    const step = this.step();
    return step === 'sent' ? 4 : step;
  });

  constructor() {
    afterNextRender(() => document.getElementById('tradeName')?.focus(), { injector: this.injector });
  }

  protected next(): void {
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
      this.firstName.set(this.form.controls.administratorFullName.value.trim().split(/\s+/)[0] ?? '');
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
      this.errorMessage.set(null);
      this.goTo((step - 1) as RegisterStep);
    }
  }

  protected isInvalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.touched && control.invalid;
  }

  private submit(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    const value = this.form.getRawValue();
    this.iam
      .registerTenant({
        ...value,
        tradeName: value.tradeName.trim(),
        administratorFullName: value.administratorFullName.trim(),
        administratorEmail: value.administratorEmail.trim(),
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.step.set('sent');
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.errorMessage.set(problemMessage(error, 'No se pudo registrar la empresa. Intente nuevamente.'));
        },
      });
  }

  private goTo(step: RegisterStep): void {
    this.step.set(step);
    if (typeof step === 'number') {
      afterNextRender(() => document.getElementById(FIRST_FIELD[step])?.focus(), { injector: this.injector });
    }
  }
}
