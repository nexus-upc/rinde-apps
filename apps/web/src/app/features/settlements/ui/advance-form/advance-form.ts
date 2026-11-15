import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { revealErrors, showError } from '@shared/forms/field-errors';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import {
  CreateAdvancePayload,
  DELIVERY_METHOD_LABELS,
  DeliveryMethod,
  SettlementTripStatus,
} from '../../models/settlement.models';

/** Formulario para registrar un anticipo antes del inicio del viaje (US25). */
@Component({
  selector: 'app-advance-form',
  imports: [ReactiveFormsModule, UiButton],
  templateUrl: './advance-form.html',
  styleUrl: './advance-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvanceForm {
  readonly pending = input(false);
  readonly error = input<string | null>(null);
  readonly tripStatus = input<SettlementTripStatus | null>(null);
  readonly resetCounter = input(0);

  readonly submitted = output<CreateAdvancePayload>();

  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly deliveryMethods: readonly { value: DeliveryMethod; label: string }[] = [
    { value: 'CASH', label: DELIVERY_METHOD_LABELS.CASH },
    { value: 'TRANSFER', label: DELIVERY_METHOD_LABELS.TRANSFER },
  ];

  protected readonly form = this.fb.group({
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    currency: this.fb.control('PEN', [Validators.required]),
    deliveryMethod: this.fb.control<DeliveryMethod>('TRANSFER', [Validators.required]),
  });

  constructor() {
    effect(() => {
      if (this.resetCounter() > 0) {
        this.form.reset({
          amount: null,
          currency: 'PEN',
          deliveryMethod: 'TRANSFER',
        });
      }
    });
  }

  protected showPreTripHint(): boolean {
    const status = this.tripStatus();
    return status === 'IN_ROUTE' || status === 'FINISHED' || status === 'SETTLED';
  }

  protected submit(): void {
    if (this.pending()) return;
    if (this.form.invalid) {
      revealErrors(this.form);
      return;
    }

    const raw = this.form.getRawValue();
    this.submitted.emit({
      amount: Number(raw.amount),
      currency: raw.currency,
      deliveryMethod: raw.deliveryMethod,
    });
  }

  protected isInvalid(name: 'amount' | 'currency' | 'deliveryMethod'): boolean {
    return showError(this.form.controls[name]);
  }
}
