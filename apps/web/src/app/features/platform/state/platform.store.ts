import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { RequestAction } from '@core/async/request-action';
import { ToastService } from '@core/feedback/toast.service';
import { PlatformApi } from '../data-access/platform-api';
import {
  AuditEntry,
  BillingOverview,
  Company,
  CreatePlan,
  IdentityOverview,
  Page,
  Payment,
  Plan,
  PlatformSection,
} from '../models/platform.models';
import { Subscription } from '../models/platform.models';
@Injectable()
export class PlatformStore {
  private readonly api = inject(PlatformApi);
  private readonly toasts = inject(ToastService);
  private readonly destroy = inject(DestroyRef);
  readonly request = new RequestAction(this.destroy);
  readonly mutation = new RequestAction(this.destroy);
  private readonly companyState = signal<readonly Company[]>([]);
  private readonly planState = signal<readonly Plan[]>([]);
  private readonly subscriptionState = signal<readonly Subscription[]>([]);
  private readonly paymentState = signal<readonly Payment[]>([]);
  private readonly auditState = signal<readonly AuditEntry[]>([]);
  private readonly overviewState = signal<{
    identity: IdentityOverview;
    billing: BillingOverview;
  } | null>(null);
  private readonly readyState = signal(false);
  private readonly paginationState = signal({ page: 0, size: 20, total: 0 });
  readonly companies = this.companyState.asReadonly();
  readonly plans = this.planState.asReadonly();
  readonly subscriptions = this.subscriptionState.asReadonly();
  readonly payments = this.paymentState.asReadonly();
  readonly audit = this.auditState.asReadonly();
  readonly overview = this.overviewState.asReadonly();
  readonly ready = this.readyState.asReadonly();
  readonly pagination = this.paginationState.asReadonly();
  private section: PlatformSection = 'overview';
  private query = '';
  private auditSource: 'identity' | 'billing' = 'identity';
  init(section: PlatformSection) {
    this.section = section;
    this.load(0);
  }
  search(query: string) {
    if (!this.request.pending()) {
      this.query = query.trim();
      this.load(0);
    }
  }
  changeAuditSource(source: 'identity' | 'billing') {
    if (!this.request.pending()) {
      this.auditSource = source;
      this.load(0);
    }
  }
  private receive<T>(page: Page<T>, update: (items: readonly T[]) => void) {
    update(page.items);
    this.paginationState.set({ page: page.page, size: page.size, total: page.total });
    this.readyState.set(true);
  }
  load(page = this.pagination().page) {
    if (this.request.pending()) return;
    const errorMessage = 'No se pudo cargar esta sección. Revisa la conexión e inténtalo de nuevo.';
    switch (this.section) {
      case 'overview':
        this.request.run(
          forkJoin({ identity: this.api.identityOverview(), billing: this.api.billingOverview() }),
          {
            onSuccess: (value) => {
              this.overviewState.set(value);
              this.readyState.set(true);
            },
            errorMessage,
          },
        );
        break;
      case 'companies':
        this.request.run(this.api.companies(page, this.query), {
          onSuccess: (value) => this.receive(value, (items) => this.companyState.set(items)),
          errorMessage,
        });
        break;
      case 'plans':
        this.request.run(this.api.plans(page), {
          onSuccess: (value) => this.receive(value, (items) => this.planState.set(items)),
          errorMessage,
        });
        break;
      case 'subscriptions':
        this.request.run(this.api.subscriptions(page), {
          onSuccess: (value) => this.receive(value, (items) => this.subscriptionState.set(items)),
          errorMessage,
        });
        break;
      case 'payments':
        this.request.run(this.api.payments(page), {
          onSuccess: (value) => this.receive(value, (items) => this.paymentState.set(items)),
          errorMessage,
        });
        break;
      case 'audit':
        this.request.run(this.api.audit(this.auditSource, page), {
          onSuccess: (value) => this.receive(value, (items) => this.auditState.set(items)),
          errorMessage,
        });
        break;
    }
  }
  createPlan(body: CreatePlan, done: () => void) {
    this.mutation.run(this.api.createPlan(body), {
      onSuccess: () => {
        this.toasts.show('El plan ya está disponible.');
        done();
        this.load(0);
      },
      errorMessage: 'No se pudo crear el plan.',
    });
  }
  changeAccess(company: Company, reason: string, done: () => void) {
    this.mutation.run(this.api.access(company, reason), {
      onSuccess: () => {
        this.toasts.show(
          company.accessSuspended
            ? 'Acceso de la empresa restablecido.'
            : 'Acceso de la empresa suspendido.',
        );
        done();
        this.load();
      },
      errorMessage: 'No se pudo cambiar el acceso.',
    });
  }
  changeAvailability(plan: Plan, reason: string, done: () => void) {
    this.mutation.run(this.api.availability(plan, reason), {
      onSuccess: () => {
        this.toasts.show(
          plan.active
            ? 'El plan dejó de ofrecerse a nuevas suscripciones.'
            : 'El plan vuelve a estar disponible.',
        );
        done();
        this.load();
      },
      errorMessage: 'No se pudo actualizar el catálogo.',
    });
  }
}
