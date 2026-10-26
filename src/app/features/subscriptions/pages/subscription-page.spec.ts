import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { Plan, Subscription } from '../models/subscription.models';
import { SubscriptionPage } from './subscription-page';

const BASE = `${environment.apiBaseUrl}/api/v1`;
const PLAN: Plan = { planId: 'plan-a', name: 'Plan Flota', monthlyPrice: 99, unitLimit: 10 };
const CURRENT: Subscription = {
  subscriptionId: 'sub-a',
  plan: PLAN,
  status: 'PENDING_PAYMENT',
  startsAt: null,
  expiresAt: null,
  renewalNotice: false,
  latestPaymentStatus: null,
  lastPaymentFailureReason: null,
};
const CHECKOUT = {
  paymentId: 'pay-a',
  providerReference: 'test-a',
  amount: 99,
  status: 'PENDING',
  simulated: true,
  confirmationEnabled: true,
};

describe('SubscriptionPage', () => {
  let fixture: ComponentFixture<SubscriptionPage>;
  let http: HttpTestingController;
  const root = () => fixture.nativeElement as HTMLElement;
  const click = (label: string) => {
    const target = Array.from(root().querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === label,
    );
    expect(target, label).toBeDefined();
    target!.click();
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SubscriptionPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SubscriptionPage);
    fixture.detectChanges();
  });
  afterEach(() => http.verify());

  function load(current: Subscription | null = null, plans: Plan[] = [PLAN]) {
    http.expectOne(`${BASE}/plans`).flush(plans);
    http
      .expectOne(`${BASE}/subscriptions/current`)
      .flush(current, current ? undefined : { status: 204, statusText: 'No Content' });
    fixture.detectChanges();
  }
  function payment() {
    click('Continuar al pago');
    http.expectOne(`${BASE}/subscriptions/sub-a/checkout`).flush(CHECKOUT);
    fixture.detectChanges();
  }

  it('loads the actual subscription and never requires a browser stored subscription id', () => {
    expect(root().textContent).toContain('Cargando suscripción');
    load(CURRENT);
    expect(root().textContent).toContain('Pendiente de pago');
    expect(root().textContent).toContain('Hasta 10 vehículos');
    expect(root().querySelector('fieldset')?.disabled).toBe(true);
  });

  it('chooses a plan, prepares its checkout, then confirms the simulated payment', () => {
    load();
    click('Elegir plan');
    const choose = http.expectOne(`${BASE}/subscriptions`);
    expect(choose.request.body).toEqual({ planId: PLAN.planId });
    choose.flush(CURRENT);
    http.expectOne(`${BASE}/subscriptions/sub-a/checkout`).flush(CHECKOUT);
    fixture.detectChanges();
    expect(root().textContent).toContain('No se harán cobros reales');
    click('Confirmar pago de prueba');
    const confirm = http.expectOne(`${BASE}/subscriptions/sub-a/payments/pay-a/simulation`);
    expect(confirm.request.body).toEqual({ status: 'CONFIRMED' });
    confirm.flush({
      ...CURRENT,
      status: 'ACTIVE',
      latestPaymentStatus: 'CONFIRMED',
      expiresAt: '2026-11-26T12:00:00Z',
    });
    fixture.detectChanges();
    expect(root().textContent).toContain('Activa');
    expect(root().textContent).toContain('Renovar suscripción');
    expect(root().textContent).not.toContain('Revisa tu pago de prueba');
  });

  it('preserves the saved plan when checkout fails so retry does not create another subscription', () => {
    load();
    click('Elegir plan');
    http.expectOne(`${BASE}/subscriptions`).flush(CURRENT);
    http
      .expectOne(`${BASE}/subscriptions/sub-a/checkout`)
      .flush({ detail: 'Pago no disponible.' }, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(root().textContent).toContain('Pago no disponible.');
    click('Continuar al pago');
    http.expectNone(`${BASE}/subscriptions`);
    http.expectOne(`${BASE}/subscriptions/sub-a/checkout`).flush(CHECKOUT);
  });

  it('does not expose confirmation actions when the server disabled simulation', () => {
    load(CURRENT);
    click('Continuar al pago');
    http
      .expectOne(`${BASE}/subscriptions/sub-a/checkout`)
      .flush({ ...CHECKOUT, confirmationEnabled: false });
    fixture.detectChanges();
    expect(root().textContent).toContain('pendiente de confirmación');
    expect(root().textContent).not.toContain('Confirmar pago de prueba');
    expect(root().textContent).not.toContain('Probar rechazo');
  });

  it('shows a rejected payment and allows another attempt', () => {
    load(CURRENT);
    payment();
    click('Probar rechazo');
    http.expectOne(`${BASE}/subscriptions/sub-a/payments/pay-a/simulation`).flush({
      ...CURRENT,
      latestPaymentStatus: 'REJECTED',
      lastPaymentFailureReason: 'Pago de prueba rechazado.',
    });
    fixture.detectChanges();
    expect(root().textContent).toContain('Pago de prueba rechazado.');
    payment();
    expect(root().textContent).toContain('Confirmar pago de prueba');
  });

  it('shows the service error and reloads through the retry control', () => {
    http.expectOne(`${BASE}/plans`).flush([]);
    http
      .expectOne(`${BASE}/subscriptions/current`)
      .flush(
        { detail: 'El servicio de identidad no está disponible.' },
        { status: 503, statusText: 'Unavailable' },
      );
    fixture.detectChanges();
    expect(root().textContent).toContain('El servicio de identidad no está disponible.');
    click('Reintentar');
    load();
    expect(root().textContent).toContain('Elige un plan para empezar');
  });

  it('renders an empty catalog without inventing plans or prices', () => {
    load(null, []);
    expect(root().textContent).toContain('No hay planes disponibles');
    expect(root().querySelector('.subscription__footer')).toBeNull();
  });

  it('returns from checkout without claiming to cancel its pending payment', () => {
    load(CURRENT);
    payment();
    click('Volver');
    expect(root().textContent).not.toContain('Revisa tu pago de prueba');
    payment();
    http.expectNone(`${BASE}/subscriptions`);
  });
});
