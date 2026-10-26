import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface Plan {
  planId: string;
  name: string;
  monthlyPrice: number;
  unitLimit: number;
}

export type SubscriptionStatus =
  'PENDING_PAYMENT' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'SUSPENDED';
export interface Subscription {
  subscriptionId: string;
  plan: Plan;
  status: SubscriptionStatus;
  startsAt: string | null;
  expiresAt: string | null;
  renewalNotice: boolean;
  latestPaymentStatus: 'PENDING' | 'CONFIRMED' | 'REJECTED' | null;
  lastPaymentFailureReason: string | null;
}

export interface Checkout {
  paymentId: string;
  providerReference: string;
  amount: number;
  status: 'PENDING';
  simulated: boolean;
  confirmationEnabled: boolean;
}

/** Suscripciones por el gateway. Las firmas y claves del pago permanecen en el servidor. */
@Injectable({ providedIn: 'root' })
export class SubscriptionApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1`;

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
  simulate(subscriptionId: string, paymentId: string, status: 'CONFIRMED' | 'REJECTED') {
    return this.http.post<Subscription>(
      `${this.base}/subscriptions/${encodeURIComponent(subscriptionId)}/payments/${encodeURIComponent(paymentId)}/simulation`,
      { status },
    );
  }
}
