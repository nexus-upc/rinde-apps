import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Subscription, SUBSCRIPTION_STATUS_LABELS } from '../../models/subscription.models';
import { formatDate, formatMoney } from '../subscription-formatters';
@Component({
  selector: 'app-subscription-summary',
  templateUrl: './subscription-summary.html',
  styleUrl: './subscription-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionSummary {
  readonly subscription = input.required<Subscription>();
  protected readonly labels = SUBSCRIPTION_STATUS_LABELS;
  protected readonly money = formatMoney;
  protected readonly date = formatDate;
}
