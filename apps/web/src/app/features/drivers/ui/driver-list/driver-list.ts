import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import { DRIVER_STATUS_LABELS, Driver } from '../../models/driver.models';

/** Componente de presentación para listar los conductores registrados. */
@Component({
  selector: 'app-driver-list',
  imports: [DatePipe, UiButton],
  templateUrl: './driver-list.html',
  styleUrl: './driver-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriverList {
  readonly drivers = input<readonly Driver[]>([]);
  readonly loading = input(false);
  readonly driverSelected = output<Driver>();

  protected readonly statusLabels = DRIVER_STATUS_LABELS;
}
