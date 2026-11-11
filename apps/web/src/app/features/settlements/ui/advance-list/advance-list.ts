import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  DELIVERY_METHOD_LABELS,
  DeliveryMethod,
  TripAdvance,
} from '../../models/settlement.models';

/** Tabla de anticipos registrados para un viaje (US25). */
@Component({
  selector: 'app-advance-list',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './advance-list.html',
  styleUrl: './advance-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvanceList {
  readonly advances = input.required<readonly TripAdvance[]>();

  protected methodLabel(method: DeliveryMethod): string {
    return DELIVERY_METHOD_LABELS[method] ?? method;
  }
}
