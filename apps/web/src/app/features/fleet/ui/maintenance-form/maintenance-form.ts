import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
  output,
} from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { revealErrors, showError } from '@shared/forms/field-errors';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import {
  MAINTENANCE_TYPES,
  RecordMaintenancePayload,
  Vehicle,
} from '../../models/fleet.models';

/** Validador personalizado para garantizar que la fecha próxima sea posterior o igual a la de ejecución. */
function dateSequenceValidator(control: AbstractControl): ValidationErrors | null {
  const execution = control.get('executionDate')?.value;
  const next = control.get('nextMaintenanceDate')?.value;
  if (execution && next && next < execution) {
    return { sequence: 'La fecha del próximo mantenimiento no puede ser anterior a la de ejecución.' };
  }
  return null;
}

/** Formulario de registro de mantenimiento técnico para unidades de flota (US34). */
@Component({
  selector: 'app-maintenance-form',
  imports: [ReactiveFormsModule, UiButton],
  templateUrl: './maintenance-form.html',
  styleUrl: './maintenance-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaintenanceForm implements OnInit {
  readonly vehicles = input<readonly Vehicle[]>([]);
  readonly preselectedVehicleId = input<string | null>(null);
  readonly pending = input(false);
  readonly error = input<string | null>(null);

  readonly submitted = output<RecordMaintenancePayload>();
  readonly cancelled = output<void>();

  protected readonly maintenanceTypes = MAINTENANCE_TYPES;

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly today = new Date().toISOString().split('T')[0];

  protected readonly form = this.fb.group(
    {
      vehicleId: this.fb.control('', [Validators.required]),
      maintenanceType: this.fb.control<string>('PREVENTIVE', [Validators.required]),
      executionDate: this.fb.control(this.today, [Validators.required]),
      mileage: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
      cost: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
      nextMaintenanceDate: this.fb.control('', [Validators.required]),
      notes: this.fb.control('', [Validators.maxLength(500)]),
    },
    { validators: [dateSequenceValidator] },
  );

  ngOnInit(): void {
    const preId = this.preselectedVehicleId();
    const firstVehicle = this.vehicles()[0];
    if (preId) {
      this.form.controls.vehicleId.setValue(preId);
    } else if (firstVehicle && !this.form.controls.vehicleId.value) {
      this.form.controls.vehicleId.setValue(firstVehicle.id);
    }
  }

  protected submit(): void {
    if (this.pending()) return;
    if (this.form.invalid) {
      revealErrors(this.form);
      return;
    }

    const value = this.form.getRawValue();
    const executionDate = String(value.executionDate || this.today);
    const nextMaintenanceDate = String(value.nextMaintenanceDate || '');
    this.submitted.emit({
      vehicleId: String(value.vehicleId),
      maintenanceType: String(value.maintenanceType),
      executionDate,
      mileage: Number(value.mileage),
      cost: Number(value.cost),
      nextMaintenanceDate,
      notes: value.notes?.trim() ? value.notes.trim() : null,
    });
  }

  protected isInvalid(
    name: 'vehicleId' | 'maintenanceType' | 'executionDate' | 'mileage' | 'cost' | 'nextMaintenanceDate',
  ): boolean {
    const control = this.form.controls[name];
    return showError(control);
  }

  protected get sequenceError(): string | null {
    return this.form.hasError('sequence') &&
      this.form.controls.nextMaintenanceDate.touched
      ? (this.form.getError('sequence') as string)
      : null;
  }
}
