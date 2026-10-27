import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import { Checkout, PaymentDecision, Plan } from '../../models/subscription.models';
import { formatMoney } from '../subscription-formatters';
@Component({
  selector: 'app-checkout-review',
  imports: [UiButton],
  templateUrl: './checkout-review.html',
  styleUrl: './checkout-review.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutReview {
  readonly payment = input.required<Checkout>();
  readonly plan = input.required<Plan>();
  readonly busy = input(false);
  readonly error = input('');
  readonly decision = output<PaymentDecision>();
  readonly back = output<void>();
  protected readonly money = formatMoney;
}
