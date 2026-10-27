export interface Plan {
  readonly planId: string;
  readonly name: string;
  readonly monthlyPrice: number;
  readonly unitLimit: number;
}

export type SubscriptionStatus =
  'PENDING_PAYMENT' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'SUSPENDED';
export interface Subscription {
  readonly subscriptionId: string;
  readonly plan: Plan;
  readonly status: SubscriptionStatus;
  readonly startsAt: string | null;
  readonly expiresAt: string | null;
  readonly renewalNotice: boolean;
  readonly latestPaymentStatus: 'PENDING' | 'CONFIRMED' | 'REJECTED' | null;
  readonly lastPaymentFailureReason: string | null;
}

export interface Checkout {
  readonly paymentId: string;
  readonly providerReference: string;
  readonly amount: number;
  readonly status: 'PENDING';
  readonly simulated: boolean;
  readonly confirmationEnabled: boolean;
}

export type PaymentDecision = 'CONFIRMED' | 'REJECTED';
export const SUBSCRIPTION_STATUS_LABELS: Readonly<Record<SubscriptionStatus, string>> = {
  PENDING_PAYMENT: 'Pendiente de pago',
  ACTIVE: 'Activa',
  EXPIRING: 'Por vencer',
  EXPIRED: 'Vencida',
  SUSPENDED: 'Suspendida',
};
