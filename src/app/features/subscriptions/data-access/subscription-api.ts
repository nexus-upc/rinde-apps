import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '@core/config/api-config';
import { Checkout, PaymentDecision, Plan, Subscription } from '../models/subscription.models';

/** Suscripciones por el gateway. Las firmas y claves del pago permanecen en el servidor. */
@Injectable({ providedIn: 'root' })
export class SubscriptionApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}/api/v1`;

  plans() {
    return this.http.get<Plan[]>(`${this.base}/plans`);
  }
  current() {
    return this.http.get<Subscription | null>(`${this.base}/subscriptions/current`);
  }
  choose(planId: string) {
    return this.http.post<Subscription>(`${this.base}/subscriptions`, { planId });
  }
  checkout(subscriptionId: string) {
    return this.http.post<Checkout>(
      `${this.base}/subscriptions/${encodeURIComponent(subscriptionId)}/checkout`,
      {},
    );
  }
  simulate(subscriptionId: string, paymentId: string, status: PaymentDecision) {
    return this.http.post<Subscription>(
      `${this.base}/subscriptions/${encodeURIComponent(subscriptionId)}/payments/${encodeURIComponent(paymentId)}/simulation`,
      { status },
    );
  }
}
