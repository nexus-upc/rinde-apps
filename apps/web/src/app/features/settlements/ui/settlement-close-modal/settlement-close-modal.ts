import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import { Settlement } from '../../models/settlement.models';

/** Modal de confirmación explícita para cerrar una liquidación (US27). */
@Component({
  selector: 'app-settlement-close-modal',
  imports: [CurrencyPipe, UiButton],
  templateUrl: './settlement-close-modal.html',
  styleUrl: './settlement-close-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettlementCloseModal {
  readonly open = input(false);
  readonly settlement = input<Settlement | null>(null);
  readonly pendingExpenseCount = input(0);
  readonly pending = input(false);
  readonly error = input<string | null>(null);

  readonly cancelled = output<void>();
  readonly confirmed = output<void>();
}
