import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import { DriverSummary, VehicleSummary } from '../../models/trip.models';

/** Formulario para asignar vehículo y conductor a un viaje programado. */
@Component({
  selector: 'app-trip-assignment-form',
  imports: [UiButton],
  templateUrl: './trip-assignment-form.html',
  styleUrl: './trip-assignment-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TripAssignmentForm {
  readonly vehicles = input.required<readonly VehicleSummary[]>();
  readonly drivers = input.required<readonly DriverSummary[]>();
  readonly selectedVehicleId = input.required<string>();
  readonly selectedDriverId = input.required<string>();
  readonly confirmOverdue = input<boolean>(false);
  readonly showOverdueConfirmation = input<boolean>(false);
  readonly maintenanceAlert = input<string | null>(null);
  readonly busy = input<boolean>(false);
  readonly actionError = input<string>('');

  readonly vehicleChange = output<string>();
  readonly driverChange = output<string>();
  readonly confirmOverdueChange = output<boolean>();
  readonly submitAssignment = output<void>();

  onVehicleSelect(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    if (target) {
      this.vehicleChange.emit(target.value);
    }
  }

  onDriverSelect(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    if (target) {
      this.driverChange.emit(target.value);
    }
  }

  onConfirmOverdueToggle(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    if (target) {
      this.confirmOverdueChange.emit(target.checked);
    }
  }

  onSubmit(): void {
    if (!this.busy()) {
      this.submitAssignment.emit();
    }
  }
}
