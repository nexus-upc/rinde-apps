import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import {
  MAINTENANCE_STATE_LABELS,
  VEHICLE_STATUS_LABELS,
  Vehicle,
  VehicleHealthStatus,
} from '../../models/fleet.models';

/** Ficha detallada de la unidad vehicular con estado operativo y salud técnica. */
@Component({
  selector: 'app-vehicle-detail-modal',
  imports: [DatePipe, DecimalPipe, UiButton],
  templateUrl: './vehicle-detail-modal.html',
  styleUrl: './vehicle-detail-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehicleDetailModal {
  readonly vehicle = input<Vehicle | null>(null);
  readonly health = input<VehicleHealthStatus | null>(null);
  readonly healthLoading = input(false);
  readonly healthError = input<string | null>(null);

  readonly closeModal = output<void>();
  readonly recordMaintenanceRequested = output<string>();

  protected readonly statusLabels = VEHICLE_STATUS_LABELS;
  protected readonly maintenanceLabels = MAINTENANCE_STATE_LABELS;
}
