import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Plan } from '../../models/subscription.models';
import { formatMoney } from '../subscription-formatters';
@Component({
  selector: 'app-plan-selector',
  templateUrl: './plan-selector.html',
  styleUrl: './plan-selector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanSelector {
  readonly plans = input<readonly Plan[]>([]);
  readonly selectedId = input<string | null>(null);
  readonly busy = input(false);
  readonly pending = input(false);
  readonly planSelected = output<string>();
  protected readonly money = formatMoney;
}
