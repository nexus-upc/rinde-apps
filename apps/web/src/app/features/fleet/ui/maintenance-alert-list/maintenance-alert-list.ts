import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import {
  MAINTENANCE_STATE_LABELS,
  MaintenanceAlert,
} from '../../models/fleet.models';

/** Componente de presentación para listar las alertas de mantenimiento preventivo de la flota. */
@Component({
  selector: 'app-maintenance-alert-list',
  imports: [DatePipe, UiButton],
  templateUrl: './maintenance-alert-list.html',
  styleUrl: './maintenance-alert-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaintenanceAlertList {
  readonly alerts = input<readonly MaintenanceAlert[]>([]);
  readonly loading = input(false);

  readonly recordRequested = output<string>();

  protected readonly stateLabels = MAINTENANCE_STATE_LABELS;
}
