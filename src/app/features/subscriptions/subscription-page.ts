import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of, switchMap, tap } from 'rxjs';
import { problemMessage } from '../../core/http/problem-message';
import {
  Checkout,
  Plan,
  Subscription,
  SubscriptionApi,
  SubscriptionStatus,
} from '../../core/subscription/subscription-api';
import { ToastService } from '../../shared/ui/toast/toast';
import { UiButton } from '../../shared/ui/ui-button/ui-button';

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  PENDING_PAYMENT: 'Pendiente de pago',
  ACTIVE: 'Activa',
  EXPIRING: 'Por vencer',
  EXPIRED: 'Vencida',
  SUSPENDED: 'Suspendida',
};

/** Elegir un plan y administrar la vigencia de la empresa, con pagos de prueba explícitos. */
@Component({
  selector: 'app-subscription-page',
  imports: [UiButton],
  templateUrl: './subscription-page.html',
  styleUrl: './subscription-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionPage {
  private readonly api = inject(SubscriptionApi);
  private readonly toasts = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly labels = STATUS_LABELS;
  protected readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly error = signal('');
  protected readonly plans = signal<Plan[]>([]);
  protected readonly subscription = signal<Subscription | null>(null);
  protected readonly selectedId = signal('');
  protected readonly checkout = signal<Checkout | null>(null);
  protected readonly busy = signal(false);
  protected readonly actionError = signal('');
  protected readonly pending = computed(() => this.subscription()?.status === 'PENDING_PAYMENT');
  protected readonly selected = computed(() => {
    const current = this.subscription();
    if (current?.status === 'PENDING_PAYMENT') return current.plan;
    return this.plans().find((plan) => plan.planId === this.selectedId()) ?? current?.plan ?? null;
  });
  protected readonly actionLabel = computed(() => {
    const current = this.subscription();
    if (current?.status === 'PENDING_PAYMENT') return 'Continuar al pago';
    return current?.plan.planId === this.selected()?.planId ? 'Renovar suscripción' : 'Elegir plan';
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    if (this.busy()) return;
    this.state.set('loading');
    this.checkout.set(null);
    this.actionError.set('');
    forkJoin({ plans: this.api.plans(), subscription: this.api.current() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ plans, subscription }) => {
          this.plans.set(plans);
          this.subscription.set(subscription);
          this.selectedId.set(subscription?.plan.planId ?? plans[0]?.planId ?? '');
          this.state.set('ready');
        },
        error: (error: unknown) => {
          this.error.set(
            problemMessage(error, 'No se pudo cargar tu suscripción. Inténtalo otra vez.'),
          );
          this.state.set('error');
        },
      });
  }

  protected select(planId: string): void {
    if (!this.busy() && !this.pending()) {
      this.selectedId.set(planId);
      this.actionError.set('');
    }
  }

  protected preparePayment(): void {
    const plan = this.selected();
    if (!plan || this.busy()) return;
    this.busy.set(true);
    this.actionError.set('');
    const current = this.subscription();
    const subscription =
      current?.plan.planId === plan.planId ? of(current) : this.api.choose(plan.planId);
    subscription
      .pipe(
        tap((value) => this.subscription.set(value)),
        switchMap((value) => this.api.checkout(value.subscriptionId)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (checkout) => {
          this.checkout.set(checkout);
          this.busy.set(false);
        },
        error: (error: unknown) => {
          this.busy.set(false);
          this.actionError.set(
            problemMessage(error, 'No se pudo preparar el pago. Inténtalo otra vez.'),
          );
        },
      });
  }

  protected simulate(status: 'CONFIRMED' | 'REJECTED'): void {
    const current = this.subscription();
    const checkout = this.checkout();
    if (!current || !checkout?.confirmationEnabled || this.busy()) return;
    this.busy.set(true);
    this.actionError.set('');
    this.api
      .simulate(current.subscriptionId, checkout.paymentId, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (subscription) => {
          this.subscription.set(subscription);
          this.checkout.set(null);
          this.busy.set(false);
          this.toasts.show(
            status === 'CONFIRMED'
              ? 'Pago de prueba confirmado. Tu suscripción está activa.'
              : 'Pago de prueba rechazado. Puedes intentarlo otra vez.',
            status === 'CONFIRMED' ? undefined : 'danger',
          );
        },
        error: (error: unknown) => {
          this.busy.set(false);
          this.actionError.set(
            problemMessage(error, 'No se pudo confirmar el resultado del pago.'),
          );
        },
      });
  }

  protected closeCheckout(): void {
    if (!this.busy()) {
      this.checkout.set(null);
      this.actionError.set('');
    }
  }

  protected money(value: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);
  }

  protected date(value: string | null): string {
    return value
      ? new Intl.DateTimeFormat('es-PE', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          timeZone: 'America/Lima',
        }).format(new Date(value))
      : 'Aún sin vigencia';
  }
}
