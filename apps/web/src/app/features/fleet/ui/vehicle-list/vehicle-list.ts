import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import { VEHICLE_STATUS_LABELS, Vehicle } from '../../models/fleet.models';

/** Componente de presentación para listar los vehículos de la flota. */
@Component({
  selector: 'app-vehicle-list',
  imports: [DecimalPipe, UiButton],
  templateUrl: './vehicle-list.html',
  styleUrl: './vehicle-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehicleList {
  readonly vehicles = input<readonly Vehicle[]>([]);
  readonly loading = input(false);
  readonly vehicleSelected = output<Vehicle>();

  protected readonly statusLabels = VEHICLE_STATUS_LABELS;
}
