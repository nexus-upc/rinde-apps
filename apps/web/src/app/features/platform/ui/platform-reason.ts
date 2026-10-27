import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AutoFocus } from '@shared/forms/autofocus';
import { UiButton } from '@shared/ui/ui-button/ui-button';
@Component({
  selector: 'app-platform-reason',
  imports: [ReactiveFormsModule, AutoFocus, UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<form class="decision" [formGroup]="form" (ngSubmit)="submit()">
    <h2>{{ title() }}</h2>
    <p>{{ description() }}</p>
    <div class="field">
      <label class="field__label" for="platform-reason">Motivo</label>
      <textarea
        appAutoFocus
        class="field__input"
        id="platform-reason"
        formControlName="reason"
        maxlength="500"
        rows="3"
        [attr.aria-invalid]="invalid() || null"
        [attr.aria-describedby]="invalid() ? 'platform-reason-error' : null"
      ></textarea>
      @if (invalid()) {
        <p id="platform-reason-error" class="field__error">
          Escribe un motivo de 3 a 500 caracteres.
        </p>
      }
    </div>
    @if (error()) {
      <p role="alert" class="field__error">{{ error() }}</p>
    }
    <div class="decision__actions">
      <button uiButton type="submit" [loading]="pending()" [disabled]="pending()">
        {{ confirmLabel() }}
      </button>
      <button type="button" class="text-link" (click)="cancel.emit()" [disabled]="pending()">
        Cancelar
      </button>
    </div>
  </form>`,
  styles: `
    .decision {
      display: grid;
      gap: 24px;
      padding: 24px;
      border-radius: var(--arc-radius-card);
      background: var(--arc-surface);
    }
    h2 {
      font-size: 18px;
      line-height: 24px;
      font-weight: 600;
      margin: 0;
    }
    p {
      color: var(--arc-muted);
      max-width: 65ch;
    }
    .decision__actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 24px;
    }
    textarea {
      resize: vertical;
      min-height: 96px;
    }
    .text-link {
      min-height: 44px;
    }
    .decision__actions button {
      min-height: 44px;
    }
    .field__input {
      background: var(--arc-bg);
    }
  `,
})
export class PlatformReason {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly confirmLabel = input.required<string>();
  readonly pending = input(false);
  readonly error = input<string | null>(null);
  readonly confirm = output<string>();
  readonly cancel = output<void>();
  protected readonly form = inject(NonNullableFormBuilder).group({
    reason: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]],
  });
  protected invalid() {
    return this.form.controls.reason.touched && this.form.controls.reason.invalid;
  }
  protected submit() {
    const value = this.form.controls.reason.value.trim();
    if (value.length < 3) this.form.controls.reason.setErrors({ minlength: true });
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.confirm.emit(value);
  }
}
