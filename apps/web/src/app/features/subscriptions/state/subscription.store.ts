import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from '@core/feedback/toast.service';
import { problemMessage } from '@core/http/problem-message';
import { forkJoin, of, switchMap, tap } from 'rxjs';
import { SubscriptionApi } from '../data-access/subscription-api';
import { Checkout, PaymentDecision, Plan, Subscription } from '../models/subscription.models';

/** Estado y coordinación de la suscripción, aislados a la vida de su página. */
@Injectable()
export class SubscriptionStore {
  private readonly api = inject(SubscriptionApi);
  private readonly toasts = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  private readonly errorState = signal('');
  private readonly plansState = signal<readonly Plan[]>([]);
  private readonly subscriptionState = signal<Subscription | null>(null);
  private readonly selectedIdState = signal('');
  private readonly checkoutState = signal<Checkout | null>(null);
  private readonly busyState = signal(false);
  private readonly actionErrorState = signal('');
  readonly state = this.loadState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly plans = this.plansState.asReadonly();
  readonly subscription = this.subscriptionState.asReadonly();
  readonly selectedId = this.selectedIdState.asReadonly();
  readonly checkout = this.checkoutState.asReadonly();
  readonly busy = this.busyState.asReadonly();
  readonly actionError = this.actionErrorState.asReadonly();
  readonly pending = computed(() => this.subscriptionState()?.status === 'PENDING_PAYMENT');
  readonly selected = computed(() => {
    const current = this.subscriptionState();
    if (current?.status === 'PENDING_PAYMENT') return current.plan;
    return (
      this.plansState().find((plan) => plan.planId === this.selectedIdState()) ??
      current?.plan ??
      null
    );
  });
  readonly actionLabel = computed(() => {
    const current = this.subscriptionState();
    if (current?.status === 'PENDING_PAYMENT') return 'Continuar al pago';
    return current?.plan.planId === this.selected()?.planId ? 'Renovar suscripción' : 'Elegir plan';
  });

  load(): void {
    if (this.busyState()) return;
    this.loadState.set('loading');
    this.checkoutState.set(null);
    this.actionErrorState.set('');
    forkJoin({ plans: this.api.plans(), subscription: this.api.current() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ plans, subscription }) => {
          this.plansState.set(plans);
          this.subscriptionState.set(subscription);
          this.selectedIdState.set(subscription?.plan.planId ?? plans[0]?.planId ?? '');
          this.loadState.set('ready');
        },
        error: (error: unknown) => {
          this.errorState.set(
            problemMessage(error, 'No se pudo cargar tu suscripción. Inténtalo otra vez.'),
          );
          this.loadState.set('error');
        },
      });
  }

  select(planId: string): void {
    if (!this.busyState() && !this.pending()) {
      this.selectedIdState.set(planId);
      this.actionErrorState.set('');
    }
  }

  preparePayment(): void {
    const plan = this.selected();
    if (!plan || this.busyState()) return;
    this.busyState.set(true);
    this.actionErrorState.set('');
    const current = this.subscriptionState();
    const subscription =
      current?.plan.planId === plan.planId ? of(current) : this.api.choose(plan.planId);
    subscription
      .pipe(
        tap((value) => this.subscriptionState.set(value)),
        switchMap((value) => this.api.checkout(value.subscriptionId)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (checkout) => {
          this.checkoutState.set(checkout);
          this.busyState.set(false);
        },
        error: (error: unknown) => {
          this.busyState.set(false);
          this.actionErrorState.set(
            problemMessage(error, 'No se pudo preparar el pago. Inténtalo otra vez.'),
          );
        },
      });
  }

  simulate(status: PaymentDecision): void {
    const current = this.subscriptionState();
    const checkout = this.checkoutState();
    if (!current || !checkout?.confirmationEnabled || this.busyState()) return;
    this.busyState.set(true);
    this.actionErrorState.set('');
    this.api
      .simulate(current.subscriptionId, checkout.paymentId, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (subscription) => {
          this.subscriptionState.set(subscription);
          this.checkoutState.set(null);
          this.busyState.set(false);
          this.toasts.show(
            status === 'CONFIRMED'
              ? 'Pago de prueba confirmado. Tu suscripción está activa.'
              : 'Pago de prueba rechazado. Puedes intentarlo otra vez.',
            status === 'CONFIRMED' ? undefined : 'danger',
          );
        },
        error: (error: unknown) => {
          this.busyState.set(false);
          this.actionErrorState.set(
            problemMessage(error, 'No se pudo confirmar el resultado del pago.'),
          );
        },
      });
  }

  readonly review = computed(() => {
    const payment = this.checkoutState();
    const subscription = this.subscriptionState();
    return payment && subscription ? { payment, plan: subscription.plan } : null;
  });

  closeCheckout(): void {
    if (!this.busyState()) {
      this.checkoutState.set(null);
      this.actionErrorState.set('');
    }
  }
}
