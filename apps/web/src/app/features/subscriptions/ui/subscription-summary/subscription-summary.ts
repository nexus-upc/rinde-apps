import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  Subscription,
  SUBSCRIPTION_STATUS_LABELS,
} from '../../models/subscription.models';
import { formatDate, formatMoney } from '../subscription-formatters';

const DAY_MS = 86_400_000;
const PAYMENT_LABELS: Readonly<Record<NonNullable<Subscription['latestPaymentStatus']>, string>> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  REJECTED: 'Rechazado',
};

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

  protected paymentLabel(): string {
    const status = this.subscription().latestPaymentStatus;
    return status ? PAYMENT_LABELS[status] : 'Sin pagos';
  }

  /** Días restantes y avance de la vigencia; nulo si el servidor aún no fija las fechas. */
  protected vigencia(): { days: number; total: number; percent: number } | null {
    const { startsAt, expiresAt } = this.subscription();
    if (!startsAt || !expiresAt) return null;
    const start = Date.parse(startsAt);
    const end = Date.parse(expiresAt);
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;
    const left = Math.max(0, end - Date.now());
    return {
      days: Math.ceil(left / DAY_MS),
      total: Math.max(1, Math.round((end - start) / DAY_MS)),
      percent: Math.min(100, (left / (end - start)) * 100),
    };
  }
}
