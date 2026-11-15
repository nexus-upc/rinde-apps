import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AutoFocus } from '@shared/forms/autofocus';
import { revealErrors, showError } from '@shared/forms/field-errors';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import { Incident } from '../../models/incident.models';

/** Modal para registrar la acción de resolución y cerrar una incidencia (US31). */
@Component({
  selector: 'app-incident-close-modal',
  imports: [ReactiveFormsModule, UiButton, AutoFocus],
  templateUrl: './incident-close-modal.html',
  styleUrl: './incident-close-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentCloseModal {
  readonly incident = input<Incident | null>(null);
  readonly pending = input(false);
  readonly error = input<string | null>(null);

  readonly cancelled = output<void>();
  readonly confirmed = output<string>();

  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
    action: this.fb.control('', [Validators.required]),
  });

  constructor() {
    effect(() => {
      const target = this.incident();
      if (target) {
        this.form.reset({ action: '' });
      }
    });
  }

  protected submit(): void {
    if (this.pending()) return;
    const rawAction = this.form.controls.action.value.trim();
    if (!rawAction) {
      this.form.controls.action.setValue('');
      revealErrors(this.form);
      return;
    }

    this.confirmed.emit(rawAction);
  }

  protected isActionInvalid(): boolean {
    return showError(this.form.controls.action);
  }
}
