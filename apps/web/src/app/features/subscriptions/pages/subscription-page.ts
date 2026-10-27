import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatePanel } from '@shared/ui/state-panel/state-panel';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import { SubscriptionStore } from '../state/subscription.store';
import { CheckoutReview } from '../ui/checkout-review/checkout-review';
import { PlanSelector } from '../ui/plan-selector/plan-selector';
import { SubscriptionSummary } from '../ui/subscription-summary/subscription-summary';
/** Contenedor de suscripción: compone vistas y delega peticiones y transiciones al estado local. */
@Component({
  selector: 'app-subscription-page',
  providers: [SubscriptionStore],
  imports: [PageHeader, StatePanel, UiButton, SubscriptionSummary, PlanSelector, CheckoutReview],
  templateUrl: './subscription-page.html',
  styleUrl: './subscription-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionPage {
  protected readonly store = inject(SubscriptionStore);
  constructor() {
    this.store.load();
  }
}
