import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_BASE_URL } from '@core/config/api-config';
import { AuthenticationResponse, SignInRequest } from '@core/auth/auth.models';
import {
  AuditEntry,
  BillingOverview,
  Company,
  CreatePlan,
  IdentityOverview,
  Page,
  Payment,
  Plan,
  PlatformProfile,
  Subscription,
} from '../models/platform.models';
@Injectable({ providedIn: 'root' })
export class PlatformApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL) + '/api/v1/platform';
  signIn(body: SignInRequest) {
    return this.http.post<AuthenticationResponse>(this.base + '/auth/sign-in', body);
  }
  profile() {
    return this.http.get<PlatformProfile>(this.base + '/me');
  }
  identityOverview() {
    return this.http.get<IdentityOverview>(this.base + '/overview');
  }
  billingOverview() {
    return this.http.get<BillingOverview>(this.base + '/billing/overview');
  }
  companies(page: number, search: string) {
    return this.http.get<Page<Company>>(this.base + '/companies', {
      params: new HttpParams().set('page', page).set('search', search),
    });
  }
  plans(page: number) {
    return this.http.get<Page<Plan>>(this.base + '/plans', { params: { page } });
  }
  subscriptions(page: number) {
    return this.http.get<Page<Subscription>>(this.base + '/subscriptions', { params: { page } });
  }
  payments(page: number) {
    return this.http.get<Page<Payment>>(this.base + '/payments', { params: { page } });
  }
  audit(source: 'identity' | 'billing', page: number) {
    return this.http.get<Page<AuditEntry>>(this.base + '/audit/' + source, { params: { page } });
  }
  createPlan(body: CreatePlan) {
    return this.http.post<Plan>(this.base + '/plans', body);
  }
  access(company: Company, reason: string) {
    return this.http.patch<Company>(
      this.base + '/companies/' + encodeURIComponent(company.id) + '/access',
      { suspended: !company.accessSuspended, reason },
    );
  }
  availability(plan: Plan, reason: string) {
    return this.http.patch<Plan>(
      this.base + '/plans/' + encodeURIComponent(plan.planId) + '/availability',
      { active: !plan.active, reason },
    );
  }
}
