import {
  ChangeDetectionStrategy,
  afterNextRender,
  ElementRef,
  Injector,
  viewChild,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatePanel } from '@shared/ui/state-panel/state-panel';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import { Company, CreatePlan, Plan, PlatformSection } from '../models/platform.models';
import { PlatformStore } from '../state/platform.store';
import { DisplayRow, PlatformRows, RowChoice } from '../ui/platform-rows';
import { PlatformReason } from '../ui/platform-reason';
import { PlatformPlanForm } from '../ui/platform-plan-form';
const LABELS: Readonly<Record<string, string>> = {
  ACTIVE: 'Activa',
  RESTRICTED: 'Restringida por suscripción',
  PENDING_VERIFICATION: 'Sin verificar',
  PENDING_PAYMENT: 'Pendiente de pago',
  EXPIRING: 'Por vencer',
  EXPIRED: 'Vencida',
  SUSPENDED: 'Suspendida',
  CONFIRMED: 'Confirmado',
  REJECTED: 'Rechazado',
  PENDING: 'Pendiente',
  COMPANY_ACCESS_SUSPENDED: 'Acceso suspendido',
  COMPANY_ACCESS_RESTORED: 'Acceso restablecido',
  PLAN_CREATED: 'Plan creado',
  PLAN_PUBLISHED: 'Plan publicado',
  PLAN_WITHDRAWN: 'Plan retirado',
};
const TITLES: Record<PlatformSection, string> = {
  overview: 'Resumen de Rinde',
  companies: 'Empresas',
  plans: 'Planes',
  subscriptions: 'Suscripciones',
  payments: 'Pagos de prueba',
  audit: 'Auditoría',
};
@Component({
  selector: 'app-platform-page',
  imports: [
    FormsModule,
    RouterLink,
    PageHeader,
    StatePanel,
    UiButton,
    PlatformRows,
    PlatformReason,
    PlatformPlanForm,
  ],
  providers: [PlatformStore],
  templateUrl: './platform-page.html',
  styleUrl: './platform-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformPage {
  protected readonly store = inject(PlatformStore);
  protected readonly section = inject(ActivatedRoute).snapshot.data['section'] as PlatformSection;
  protected readonly title = TITLES[this.section];
  protected readonly searchText = signal('');
  protected readonly selectedCompany = signal<Company | null>(null);
  protected readonly selectedPlan = signal<Plan | null>(null);
  protected readonly creating = signal(false);
  protected readonly auditSource = signal<'identity' | 'billing'>('identity');
  private trigger: HTMLButtonElement | null = null;
  private readonly injector = inject(Injector);
  private readonly createButton = viewChild<UiButton, ElementRef<HTMLButtonElement>>(
    'createTrigger',
    {
      read: ElementRef,
    },
  );
  protected readonly money = (value: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);
  protected readonly date = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(
          new Date(value),
        )
      : 'Sin fecha';
  protected readonly rows = computed<readonly DisplayRow[]>(() => {
    switch (this.section) {
      case 'companies':
        return this.store.companies().map((c) => ({
          id: c.id,
          title: c.tradeName,
          subtitle: 'RUC ' + c.ruc,
          status: c.accessSuspended ? 'Acceso suspendido' : (LABELS[c.status] ?? c.status),
          facts: [
            { label: 'Acceso', value: c.accessSuspended ? 'Suspendido por Rinde' : 'Habilitado' },
            { label: 'Estado comercial', value: LABELS[c.status] ?? c.status },
          ],
          action: 'Gestionar acceso',
        }));
      case 'plans':
        return this.store.plans().map((plan) => ({
          id: plan.planId,
          title: plan.name,
          subtitle: this.money(plan.monthlyPrice) + ' al mes',
          status: plan.active ? 'Disponible' : 'Retirado',
          facts: [
            { label: 'Límite', value: plan.unitLimit + ' unidades' },
            { label: 'Moneda', value: 'Soles (PEN)' },
          ],
          action: 'Gestionar disponibilidad',
        }));
      case 'subscriptions':
        return this.store.subscriptions().map((s) => ({
          id: s.id,
          title: s.companyName,
          subtitle: s.planName,
          status: LABELS[s.status] ?? s.status,
          facts: [
            { label: 'Precio mensual', value: this.money(s.monthlyPrice) },
            { label: 'Inicio', value: this.date(s.startsAt) },
            { label: 'Vigencia', value: this.date(s.expiresAt) },
          ],
        }));
      case 'payments':
        return this.store.payments().map((payment) => ({
          id: payment.id,
          title: payment.companyName,
          subtitle: payment.planName,
          status: LABELS[payment.status] ?? payment.status,
          facts: [
            { label: 'Importe de prueba', value: this.money(payment.amount) },
            { label: 'Fecha', value: this.date(payment.createdAt) },
            { label: 'Referencia', value: payment.reference },
          ],
        }));
      case 'audit':
        return this.store.audit().map((entry) => ({
          id: entry.id,
          title: LABELS[entry.action] ?? entry.action,
          subtitle: entry.actorEmail,
          status: this.date(entry.occurredAt),
          facts: [
            { label: 'Motivo', value: entry.reason },
            {
              label: 'Antes',
              value:
                entry.targetType === 'COMPANY'
                  ? entry.beforeState === 'true'
                    ? 'Acceso suspendido'
                    : 'Acceso habilitado'
                  : entry.beforeState === 'absent'
                    ? 'Sin registro'
                    : entry.beforeState,
            },
            {
              label: 'Después',
              value:
                entry.targetType === 'COMPANY'
                  ? entry.afterState === 'true'
                    ? 'Acceso suspendido'
                    : 'Acceso habilitado'
                  : entry.afterState,
            },
            { label: 'Registro afectado', value: entry.targetId },
          ],
        }));
      default:
        return [];
    }
  });
  constructor() {
    this.store.init(this.section);
  }
  protected choose(choice: RowChoice) {
    this.trigger = choice.trigger;
    this.store.mutation.clearError();
    this.selectedCompany.set(this.store.companies().find((c) => c.id === choice.id) ?? null);
    this.selectedPlan.set(this.store.plans().find((plan) => plan.planId === choice.id) ?? null);
  }
  protected beginCreate(event: Event) {
    this.trigger = event.currentTarget as HTMLButtonElement;
    this.store.mutation.clearError();
    this.creating.set(true);
  }
  protected close() {
    if (this.store.mutation.pending()) return;
    this.clearSelection();
  }
  private clearSelection() {
    this.creating.set(false);
    this.selectedCompany.set(null);
    this.selectedPlan.set(null);
    afterNextRender(
      () =>
        (this.trigger?.isConnected ? this.trigger : this.createButton()?.nativeElement)?.focus(),
      { injector: this.injector },
    );
  }
  protected createPlan(body: CreatePlan) {
    this.store.createPlan(body, () => this.clearSelection());
  }
  protected decide(reason: string) {
    const company = this.selectedCompany();
    const plan = this.selectedPlan();
    if (company) this.store.changeAccess(company, reason, () => this.clearSelection());
    else if (plan) this.store.changeAvailability(plan, reason, () => this.clearSelection());
  }
  protected changeAudit(source: 'identity' | 'billing') {
    this.auditSource.set(source);
    this.store.changeAuditSource(source);
  }
  protected search() {
    this.store.search(this.searchText());
  }
}
