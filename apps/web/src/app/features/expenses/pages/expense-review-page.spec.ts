import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Expense } from '../models/expense.models';
import { ExpenseReviewPage } from './expense-review-page';

const BASE = `${environment.apiBaseUrl}/api/v1`;
const EVIDENCE_URL = `${environment.apiBaseUrl}/api/v1/expenses/exp-1/evidences/evi-1/content`;

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
      fileName: 'ticket_primax.jpg',
      contentType: 'image/jpeg',
      fileSizeBytes: 1048576,
      contentUrl: '/api/v1/expenses/exp-1/evidences/evi-1/content',
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
  // jsdom no implementa las URL de objeto; se simulan para verificar su creación y liberación.
  const createObjectUrl = vi.fn(() => 'blob:rinde-evidence-1');
  const revokeObjectUrl = vi.fn();

  beforeEach(async () => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectUrl });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectUrl });
    createObjectUrl.mockClear();
    revokeObjectUrl.mockClear();

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

  it('debe descargar el comprobante con la ruta autenticada y mostrarlo como imagen', () => {
    fixture.detectChanges();

    http.expectOne(`${BASE}/trips/trip-100/expenses`).flush(MOCK_EXPENSES);
    fixture.detectChanges();

    component.onReviewExpense(MOCK_EXPENSES[0]!);
    fixture.detectChanges();

    const reqContent = http.expectOne(EVIDENCE_URL);
    expect(reqContent.request.method).toBe('GET');
    expect(reqContent.request.responseType).toBe('blob');
    reqContent.flush(new Blob(['jpeg'], { type: 'image/jpeg' }));
    fixture.detectChanges();

    expect(createObjectUrl).toHaveBeenCalledTimes(1);
    const img = (fixture.nativeElement as HTMLElement).querySelector('.evidence-preview img');
    expect(img?.getAttribute('src')).toBe('blob:rinde-evidence-1');
  });

  it('debe liberar la URL del comprobante al destruir la página', () => {
    fixture.detectChanges();

    http.expectOne(`${BASE}/trips/trip-100/expenses`).flush(MOCK_EXPENSES);
    component.onReviewExpense(MOCK_EXPENSES[0]!);
    http.expectOne(EVIDENCE_URL).flush(new Blob(['jpeg'], { type: 'image/jpeg' }));

    fixture.destroy();

    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:rinde-evidence-1');
  });

  it('debe avisar si el archivo del comprobante no se puede descargar', () => {
    fixture.detectChanges();

    http.expectOne(`${BASE}/trips/trip-100/expenses`).flush(MOCK_EXPENSES);
    component.onReviewExpense(MOCK_EXPENSES[0]!);
    http
      .expectOne(EVIDENCE_URL)
      .flush(new Blob(['{}'], { type: 'application/problem+json' }), {
        status: 404,
        statusText: 'Not Found',
      });
    fixture.detectChanges();

    const native = fixture.nativeElement as HTMLElement;
    expect(native.textContent).toContain('No fue posible cargar el comprobante.');
    expect(createObjectUrl).not.toHaveBeenCalled();
  });
});
