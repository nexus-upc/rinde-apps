import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import {
  Settlement,
  SettlementTripOption,
  TripAdvance,
} from '../../models/settlement.models';
import { SettlementsPage } from './settlements-page';

const BASE = `${environment.apiBaseUrl}/api/v1`;

const MOCK_TRIPS: SettlementTripOption[] = [
  {
    id: 'trip-1',
    code: 'TRP-000101',
    origin: 'Lima',
    destination: 'Arequipa',
    departureDate: '2026-11-12',
    status: 'FINISHED',
  },
];

const MOCK_ADVANCES: TripAdvance[] = [
  {
    id: 'adv-1',
    tripId: 'trip-1',
    amount: 400,
    currency: 'PEN',
    deliveryMethod: 'TRANSFER',
    registeredBy: 'ops@example.test',
    registeredAt: '2026-11-10T09:00:00Z',
  },
];

const MOCK_SETTLEMENT: Settlement = {
  id: 'stl-1',
  tenantId: 'tenant-1',
  tripId: 'trip-1',
  driverId: 'drv-1',
  status: 'OPEN',
  advanceAmount: 400,
  advanceCurrency: 'PEN',
  expenseTotalAmount: 180,
  expenseTotalCurrency: 'PEN',
  advanceBalance: 220,
  createdAt: '2026-11-11T10:00:00Z',
  updatedAt: '2026-11-11T11:00:00Z',
};

describe('SettlementsPage', () => {
  let fixture: ComponentFixture<SettlementsPage>;
  let http: HttpTestingController;
  const createObjectUrl = vi.fn(() => 'blob:settlement-csv');
  const revokeObjectUrl = vi.fn();

  const root = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectUrl });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectUrl });
    createObjectUrl.mockClear();
    revokeObjectUrl.mockClear();

    await TestBed.configureTestingModule({
      imports: [SettlementsPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({}),
              queryParamMap: convertToParamMap({ tripId: 'trip-1' }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettlementsPage);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  function flushTripRequests(options?: {
    settlement?: Settlement | null;
    expenses?: { id: string; status: string }[];
  }): void {
    http.expectOne(`${BASE}/trips`).flush(MOCK_TRIPS);
    http.expectOne(`${BASE}/trips/trip-1/advances`).flush(MOCK_ADVANCES);

    const settlementReq = http.expectOne(`${BASE}/trips/trip-1/settlement`);
    if (options?.settlement === null) {
      settlementReq.flush(
        { detail: 'No existe liquidación para este viaje.' },
        { status: 404, statusText: 'Not Found' },
      );
    } else {
      settlementReq.flush(options?.settlement ?? MOCK_SETTLEMENT);
    }

    http
      .expectOne(`${BASE}/trips/trip-1/expenses`)
      .flush(
        options?.expenses ?? [
          { id: 'exp-1', status: 'REGISTERED' },
          { id: 'exp-2', status: 'PENDING_SUPPORT' },
          { id: 'exp-3', status: 'APPROVED' },
        ],
      );
    fixture.detectChanges();
  }

  it('loads settlement summary, advances, and warning banner for unreviewed expenses', () => {
    fixture.detectChanges();
    flushTripRequests();

    const text = root().textContent ?? '';
    expect(text).toContain('Liquidaciones y anticipos');
    expect(text).toContain('Abierta');
    expect(text).toContain('400.00');
    expect(text).toContain('180.00');
    expect(text).toContain('220.00');
    expect(text).toContain('Transferencia');
    expect(text).toContain('Gastos pendientes de revisión:');
    expect(text).toContain('Existen 2 gasto(s) en estado Registrado o Pendiente de soporte.');
  });

  it('shows pending notice when settlement returns 404 and registers an advance', () => {
    fixture.detectChanges();
    flushTripRequests({ settlement: null, expenses: [] });

    expect(root().textContent).toContain('No existe liquidación para este viaje.');

    const amountInput = root().querySelector('#advance-amount') as HTMLInputElement;
    amountInput.value = '250';
    amountInput.dispatchEvent(new Event('input'));

    const methodSelect = root().querySelector('#advance-delivery') as HTMLSelectElement;
    methodSelect.value = 'CASH';
    methodSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const form = root().querySelector('form.advance-form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const req = http.expectOne(`${BASE}/trips/trip-1/advances`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      amount: 250,
      currency: 'PEN',
      deliveryMethod: 'CASH',
    });

    req.flush({
      id: 'adv-2',
      tripId: 'trip-1',
      amount: 250,
      currency: 'PEN',
      deliveryMethod: 'CASH',
      registeredBy: 'ops@example.test',
      registeredAt: '2026-11-11T12:00:00Z',
    });
    fixture.detectChanges();

    expect(root().textContent).toContain('250.00');
    expect(root().textContent).toContain('Efectivo');
  });

  it('displays API error when registering an advance fails with 409', () => {
    fixture.detectChanges();
    flushTripRequests({ expenses: [] });

    const amountInput = root().querySelector('#advance-amount') as HTMLInputElement;
    amountInput.value = '100';
    amountInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = root().querySelector('form.advance-form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    http.expectOne(`${BASE}/trips/trip-1/advances`).flush(
      { detail: 'No se permiten anticipos después de iniciar el viaje.' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(root().textContent).toContain('No se permiten anticipos después de iniciar el viaje.');
  });

  it('recalculates settlement and updates balance and pending count', () => {
    fixture.detectChanges();
    flushTripRequests();

    const recalcBtn = Array.from(root().querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Recalcular'),
    );
    recalcBtn?.click();
    fixture.detectChanges();

    const req = http.expectOne(`${BASE}/settlements/stl-1/recalculation`);
    expect(req.request.method).toBe('POST');
    req.flush({
      ...MOCK_SETTLEMENT,
      expenseTotalAmount: 350,
      advanceBalance: 50,
      pendingExpenseCount: 0,
    });
    fixture.detectChanges();

    expect(root().textContent).toContain('350.00');
    expect(root().textContent).toContain('50.00');
    expect(root().textContent).not.toContain('Gastos pendientes de revisión:');
  });

  it('opens close modal, shows 409 API error when close is rejected, then closes cleanly', () => {
    fixture.detectChanges();
    flushTripRequests();

    const openModalBtn = Array.from(root().querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Cerrar liquidación'),
    );
    openModalBtn?.click();
    fixture.detectChanges();

    expect(root().textContent).toContain('Confirmar cierre de liquidación');

    const confirmBtn = Array.from(root().querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Confirmar cierre'),
    );
    confirmBtn?.click();
    fixture.detectChanges();

    const rejectedReq = http.expectOne(`${BASE}/settlements/stl-1/close`);
    expect(rejectedReq.request.method).toBe('POST');
    rejectedReq.flush(
      {
        detail:
          'No se puede cerrar la liquidación mientras haya gastos sin revisar. Apruébelos u obsérvelos primero.',
      },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(root().textContent).toContain(
      'No se puede cerrar la liquidación mientras haya gastos sin revisar.',
    );

    confirmBtn?.click();
    fixture.detectChanges();

    http.expectOne(`${BASE}/settlements/stl-1/close`).flush({
      ...MOCK_SETTLEMENT,
      status: 'CLOSED',
    });
    fixture.detectChanges();

    expect(root().textContent).not.toContain('Confirmar cierre de liquidación');
    expect(root().textContent).toContain('Cerrada');
  });

  it('exports settlement CSV and displays API error if export fails', async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    try {
      fixture.detectChanges();
      flushTripRequests({ expenses: [] });

      const exportBtn = Array.from(root().querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Exportar CSV'),
      );
      exportBtn?.click();
      fixture.detectChanges();

      const reqOk = http.expectOne(`${BASE}/settlements/stl-1/export`);
      expect(reqOk.request.method).toBe('GET');
      expect(reqOk.request.responseType).toBe('blob');
      reqOk.flush(new Blob(['id,status\nstl-1,OPEN\n'], { type: 'text/csv' }), {
        headers: { 'Content-Disposition': 'attachment; filename=settlement-stl-1.csv' },
      });
      fixture.detectChanges();

      expect(createObjectUrl).toHaveBeenCalledTimes(1);
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrl).toHaveBeenCalledWith('blob:settlement-csv');

      exportBtn?.click();
      fixture.detectChanges();

      http.expectOne(`${BASE}/settlements/stl-1/export`).flush(
        new Blob([JSON.stringify({ detail: 'No existe liquidación para exportar.' })], {
          type: 'application/problem+json',
        }),
        {
          status: 404,
          statusText: 'Not Found',
        },
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      fixture.detectChanges();

      expect(root().textContent).toContain('No existe liquidación para exportar.');
    } finally {
      clickSpy.mockRestore();
    }
  });
});
