import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import {
  SETTLEMENT_STATUS_LABELS,
  Settlement,
  SettlementStatus,
} from '../../models/settlement.models';

/** Detalle de la liquidación del viaje y sus acciones de recálculo, cierre y exportación (US26, US27 y US35). */
@Component({
  selector: 'app-settlement-summary',
  imports: [CurrencyPipe, DatePipe, UiButton],
  templateUrl: './settlement-summary.html',
  styleUrl: './settlement-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettlementSummary {
  readonly settlement = input.required<Settlement>();
  readonly busy = input(false);
  readonly recalculating = input(false);
  readonly exporting = input(false);
  readonly actionError = input<string | null>(null);

  readonly recalculate = output<void>();
  readonly requestClose = output<void>();
  readonly exportCsv = output<void>();

  protected statusLabel(status: SettlementStatus): string {
    return SETTLEMENT_STATUS_LABELS[status] ?? status;
  }
}
