import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import { AutoFocus } from '@shared/forms/autofocus';
import { CreatePlan } from '../models/platform.models';
@Component({
  selector: 'app-platform-plan-form',
  imports: [ReactiveFormsModule, UiButton, AutoFocus],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<form class="plan-form" [formGroup]="form" (ngSubmit)="submit()">
    <h2>Nuevo plan</h2>
    <p>
      El precio y el límite quedan asociados a este plan. Para cambiarlos después, crea un nuevo
      plan.
    </p>
    <fieldset [disabled]="pending()">
      <div class="field">
        <label class="field__label" for="plan-name">Nombre</label
        ><input
          appAutoFocus
          id="plan-name"
          class="field__input"
          formControlName="name"
          maxlength="80"
          [attr.aria-invalid]="bad('name') || null"
          [attr.aria-describedby]="bad('name') ? 'plan-form-errors' : null"
        />
      </div>
      <div class="plan-form__pair">
        <div class="field">
          <label class="field__label" for="plan-price">Precio mensual (S/)</label
          ><input
            id="plan-price"
            class="field__input"
            type="number"
            formControlName="monthlyPrice"
            min="0.01"
            max="99999999.99"
            step="0.01"
            [attr.aria-invalid]="bad('monthlyPrice') || null"
            [attr.aria-describedby]="bad('monthlyPrice') ? 'plan-form-errors' : null"
          />
        </div>
        <div class="field">
          <label class="field__label" for="plan-limit">Límite de unidades</label
          ><input
            id="plan-limit"
            class="field__input"
            type="number"
            formControlName="unitLimit"
            min="1"
            max="100000"
            step="1"
            [attr.aria-invalid]="bad('unitLimit') || null"
            [attr.aria-describedby]="bad('unitLimit') ? 'plan-form-errors' : null"
          />
        </div>
      </div>
      <div class="field">
        <label class="field__label" for="plan-reason">Motivo del alta</label
        ><textarea
          id="plan-reason"
          class="field__input"
          formControlName="reason"
          rows="2"
          maxlength="500"
          [attr.aria-invalid]="bad('reason') || null"
          [attr.aria-describedby]="bad('reason') ? 'plan-form-errors' : null"
        ></textarea>
      </div>
    </fieldset>
    @if (invalid) {
      <p class="field__error" id="plan-form-errors" role="alert">
        Completa el nombre, un precio positivo, un límite entero y un motivo de al menos 3
        caracteres.
      </p>
    }
    @if (error()) {
      <p class="field__error" role="alert">{{ error() }}</p>
    }
    <div class="plan-form__actions">
      <button uiButton type="submit" [loading]="pending()" [disabled]="pending()">Crear plan</button
      ><button type="button" class="text-link" [disabled]="pending()" (click)="cancel.emit()">
        Cancelar
      </button>
    </div>
  </form>`,
  styles: `
    .plan-form {
      display: grid;
      gap: 24px;
      padding: 24px;
      background: var(--arc-surface);
      border-radius: var(--arc-radius-card);
    }
    h2 {
      margin: 0;
      font-size: 18px;
      line-height: 24px;
      font-weight: 600;
    }
    p {
      color: var(--arc-muted);
      max-width: 65ch;
    }
    fieldset {
      border: 0;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 24px;
      min-width: 0;
    }
    .plan-form__pair {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 24px;
    }
    .plan-form__actions {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 24px;
    }
    .text-link {
      min-height: 44px;
    }
    .plan-form__actions button {
      min-height: 44px;
    }
    .field__input {
      background: var(--arc-bg);
    }
    textarea {
      resize: vertical;
    }
    @media (max-width: 640px) {
      .plan-form__pair {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `,
})
export class PlatformPlanForm {
  readonly pending = input(false);
  readonly error = input<string | null>(null);
  readonly create = output<CreatePlan>();
  readonly cancel = output<void>();
  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    monthlyPrice: [0, [Validators.required, Validators.min(0.01), Validators.max(99999999.99)]],
    unitLimit: [
      1,
      [Validators.required, Validators.min(1), Validators.max(100000), Validators.pattern(/^\d+$/)],
    ],
    reason: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]],
  });
  protected invalid = false;
  protected bad(name: 'name' | 'monthlyPrice' | 'unitLimit' | 'reason') {
    return this.form.controls[name].touched && this.form.controls[name].invalid;
  }
  protected submit() {
    const value = this.form.getRawValue();
    this.form.controls.name.setValue(value.name.trim());
    this.form.controls.reason.setValue(value.reason.trim());
    if (this.form.invalid || !Number.isInteger(value.unitLimit)) {
      this.invalid = true;
      this.form.markAllAsTouched();
      return;
    }
    this.invalid = false;
    this.create.emit(this.form.getRawValue());
  }
}
