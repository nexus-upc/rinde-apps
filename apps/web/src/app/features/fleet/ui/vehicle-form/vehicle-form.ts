import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AutoFocus } from '@shared/forms/autofocus';
import { revealErrors, showError } from '@shared/forms/field-errors';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import { CreateVehiclePayload } from '../../models/fleet.models';

/** Formulario para dar de alta un vehículo en la flota. */
@Component({
  selector: 'app-vehicle-form',
  imports: [ReactiveFormsModule, UiButton, AutoFocus],
  templateUrl: './vehicle-form.html',
  styleUrl: './vehicle-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehicleForm {
  readonly pending = input(false);
  readonly error = input<string | null>(null);
  readonly submitted = output<CreateVehiclePayload>();
  readonly cancelled = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly currentYear = new Date().getFullYear();

  protected readonly form = this.fb.group({
    plateNumber: this.fb.control('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(10),
    ]),
    brand: this.fb.control('', [Validators.required, Validators.maxLength(50)]),
    model: this.fb.control('', [Validators.required, Validators.maxLength(50)]),
    modelYear: this.fb.control<number | null>(this.currentYear, [
      Validators.required,
      Validators.min(1990),
      Validators.max(this.currentYear + 1),
    ]),
    payloadCapacityKg: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(1),
    ]),
  });

  protected submit(): void {
    if (this.pending()) return;
    if (this.form.invalid) {
      revealErrors(this.form);
      return;
    }

    const value = this.form.getRawValue();
    this.submitted.emit({
      plateNumber: value.plateNumber.trim().toUpperCase(),
      brand: value.brand.trim(),
      model: value.model.trim(),
      modelYear: Number(value.modelYear),
      payloadCapacityKg: Number(value.payloadCapacityKg),
    });
  }

  protected isInvalid(name: 'plateNumber' | 'brand' | 'model' | 'modelYear' | 'payloadCapacityKg'): boolean {
    const control = this.form.controls[name];
    return showError(control);
  }
}
