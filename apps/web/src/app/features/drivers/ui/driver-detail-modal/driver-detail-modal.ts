import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import {
  DRIVER_STATUS_LABELS,
  Driver,
  DriverEligibility,
  LICENSE_STATUS_LABELS,
} from '../../models/driver.models';

/** Ficha técnica y operativa de un conductor con validación de elegibilidad. */
@Component({
  selector: 'app-driver-detail-modal',
  imports: [DatePipe, UiButton],
  templateUrl: './driver-detail-modal.html',
  styleUrl: './driver-detail-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriverDetailModal {
  readonly driver = input<Driver | null>(null);
  readonly eligibility = input<DriverEligibility | null>(null);
  readonly eligibilityLoading = input(false);
  readonly eligibilityError = input<string | null>(null);

  readonly closeModal = output<void>();

  protected readonly statusLabels = DRIVER_STATUS_LABELS;
  protected readonly licenseLabels = LICENSE_STATUS_LABELS;
}
