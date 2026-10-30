import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import { CreateTripPayload } from '../../models/trip.models';

/** Formulario de programación de viaje: emite el payload al página contenedora. */
@Component({
  selector: 'app-trip-form',
  imports: [ReactiveFormsModule, UiButton],
  templateUrl: './trip-form.html',
  styleUrl: './trip-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TripForm {
  readonly busy = input(false);
  readonly error = input('');
  readonly submitted = output<CreateTripPayload>();
  readonly cancelled = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
    origin: this.fb.control('', [Validators.required, Validators.maxLength(200)]),
    destination: this.fb.control('', [Validators.required, Validators.maxLength(200)]),
    cargoDescription: this.fb.control('', [Validators.required, Validators.maxLength(500)]),
    cargoWeightKg: this.fb.control(''),
    departureDate: this.fb.control('', [Validators.required]),
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const cargoWeightKg = value.cargoWeightKg ? Number(value.cargoWeightKg) : null;
    this.submitted.emit({
      origin: value.origin,
      destination: value.destination,
      cargoDescription: value.cargoDescription,
      cargoWeightKg,
      departureDate: value.departureDate,
    });
  }

  protected isInvalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }
}
