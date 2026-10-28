import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Expense } from '../models/expense.models';
import { ExpenseReviewPage } from './expense-review-page';

const BASE = `${environment.apiBaseUrl}/api/v1`;

const MOCK_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    tenantId: 'tenant-1',
    tripId: 'trip-100',
    driverId: 'drv-1',
    category: 'FUEL',
    amount: 250.5,
    currency: 'PEN',
    expenseDate: '2026-10-28',
    status: 'REGISTERED',
    idempotencyKey: 'EXP-101',
    observationReason: null,
    isLocked: false,
    evidence: {
      id: 'evi-1',
      imageUrl: 'http://localhost:8080/files/ticket_primax.jpg',
      fileSizeBytes: 1048576,
      uploadedAt: '2026-10-28T12:00:00Z',
    },
    createdAt: '2026-10-28T12:00:00Z',
  },
  {
    id: 'exp-2',
    tenantId: 'tenant-1',
    tripId: 'trip-100',
    driverId: 'drv-1',
    category: 'TOLL',
    amount: 15.0,
    currency: 'PEN',
    expenseDate: '2026-10-28',
    status: 'APPROVED',
    idempotencyKey: 'EXP-102',
    observationReason: null,
    isLocked: false,
    evidence: null,
    createdAt: '2026-10-28T12:30:00Z',
  },
];

describe('ExpenseReviewPage', () => {
  let fixture: ComponentFixture<ExpenseReviewPage>;
  let component: ExpenseReviewPage;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseReviewPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ tripId: 'trip-100' }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpenseReviewPage);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('debe cargar y listar los comprobantes del viaje indicado en la ruta', () => {
    fixture.detectChanges();

    const req = http.expectOne(`${BASE}/trips/trip-100/expenses`);
    expect(req.request.method).toBe('GET');
    req.flush(MOCK_EXPENSES);

    fixture.detectChanges();

    const native = fixture.nativeElement as HTMLElement;
    expect(native.textContent).toContain('EXP-101');
    expect(native.textContent).toContain('EXP-102');
  });

  it('debe permitir aprobar un gasto registrado', () => {
    fixture.detectChanges();

    const reqList = http.expectOne(`${BASE}/trips/trip-100/expenses`);
    reqList.flush(MOCK_EXPENSES);

    fixture.detectChanges();

    component.onApprove('exp-1');

    const reqPatch = http.expectOne(`${BASE}/expenses/exp-1/status`);
    expect(reqPatch.request.method).toBe('PATCH');
    expect(reqPatch.request.body).toEqual({ status: 'APPROVED' });

    const updatedExpense: Expense = {
      ...MOCK_EXPENSES[0]!,
      status: 'APPROVED',
    };
    reqPatch.flush(updatedExpense);

    fixture.detectChanges();

    const native = fixture.nativeElement as HTMLElement;
    expect(native.textContent).toContain('Aprobado');
  });

  it('debe permitir observar un gasto con motivo', () => {
    fixture.detectChanges();

    const reqList = http.expectOne(`${BASE}/trips/trip-100/expenses`);
    reqList.flush(MOCK_EXPENSES);

    fixture.detectChanges();

    component.onObserve({
      id: 'exp-1',
      reason: 'Comprobante borroso y desgastado',
    });

    const reqPatch = http.expectOne(`${BASE}/expenses/exp-1/status`);
    expect(reqPatch.request.method).toBe('PATCH');
    expect(reqPatch.request.body).toEqual({
      status: 'OBSERVED',
      reason: 'Comprobante borroso y desgastado',
    });

    const updatedExpense: Expense = {
      ...MOCK_EXPENSES[0]!,
      status: 'OBSERVED',
      observationReason: 'Comprobante borroso y desgastado',
    };
    reqPatch.flush(updatedExpense);

    fixture.detectChanges();

    const native = fixture.nativeElement as HTMLElement;
    expect(native.textContent).toContain('Observado');
  });
});
