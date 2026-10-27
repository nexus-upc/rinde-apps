export type PlatformSection =
  'overview' | 'companies' | 'plans' | 'subscriptions' | 'payments' | 'audit';
export interface Page<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly size: number;
  readonly total: number;
}
export interface PlatformProfile {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly role: 'PLATFORM_OWNER';
}
export interface Company {
  readonly id: string;
  readonly tradeName: string;
  readonly ruc: string;
  readonly status: string;
  readonly accessSuspended: boolean;
}
export interface Plan {
  readonly planId: string;
  readonly name: string;
  readonly monthlyPrice: number;
  readonly unitLimit: number;
  readonly active: boolean;
}
export interface Subscription {
  readonly id: string;
  readonly tenantId: string;
  readonly companyName: string;
  readonly planId: string;
  readonly planName: string;
  readonly status: string;
  readonly startsAt: string | null;
  readonly expiresAt: string | null;
  readonly monthlyPrice: number;
}
export interface Payment {
  readonly id: string;
  readonly tenantId: string;
  readonly companyName: string;
  readonly subscriptionId: string;
  readonly planName: string;
  readonly amount: number;
  readonly status: string;
  readonly createdAt: string;
  readonly reference: string;
}
export interface AuditEntry {
  readonly id: string;
  readonly actorEmail: string;
  readonly action: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly reason: string;
  readonly beforeState: string;
  readonly afterState: string;
  readonly occurredAt: string;
}
export interface IdentityOverview {
  readonly companies: number;
  readonly suspendedCompanies: number;
  readonly companyUsers: number;
}
export interface BillingOverview {
  readonly plans: number;
  readonly activePlans: number;
  readonly subscriptions: number;
  readonly pendingSubscriptions: number;
  readonly confirmedPayments: number;
  readonly confirmedAmount: number;
  readonly currency: string;
  readonly paymentMode: string;
}
export interface CreatePlan {
  readonly name: string;
  readonly monthlyPrice: number;
  readonly unitLimit: number;
  readonly reason: string;
}
