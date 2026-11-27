import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { environment } from '../../../../environments/environment';
import {
  EXPENSE_DRIVERS_FIXTURE,
  EXPENSE_PAGE_FIXTURE,
  EXPENSE_TRIPS_FIXTURE,
} from '../fixtures/expense.fixtures';
import { Expense, ExpensePage } from '../models/expense.models';
import { ExpenseReviewPage } from './expense-review-page';

const BASE = `${environment.apiBaseUrl}/api/v1`;
const FIRST_EXPENSE = EXPENSE_PAGE_FIXTURE.items[0]!;
const EVIDENCE_URL = `${environment.apiBaseUrl}${FIRST_EXPENSE.evidence!.contentUrl}`;

const SECOND_EXPENSE: Expense = {
  id: '9a881122-d520-4d01-838a-1a574c7d9999',
  tenantId: 'd011f0a2-2b6f-4d32-9cb4-fa6d7cb81698',
  tripId: '2a11bc09-98d4-4c55-8a01-9f38d9491111',
  driverId: '5511a2b3-403f-40d7-9172-ba637d109999',
  category: 'LODGING',
  amount: 145,
  currency: 'PEN',
  expenseDate: '2026-11-19',
  status: 'PENDING_SUPPORT',
  idempotencyKey: 'EXP-9832-UUID-02',
  observationReason: null,
  isLocked: false,
  evidence: null,
  createdAt: '2026-11-19T18:00:00Z',
};

const MULTI_PAGE_FIXTURE: ExpensePage = {
  items: [FIRST_EXPENSE, SECOND_EXPENSE],
  page: 0,
  size: 20,
  totalItems: 2,
  totalPages: 1,
};

describe('ExpenseReviewPage', () => {
  let fixture: ComponentFixture<ExpenseReviewPage>;
  let component: ExpenseReviewPage;
  let http: HttpTestingController;

  const createObjectUrl = vi.fn(() => 'blob:rinde-evidence-1');
  const revokeObjectUrl = vi.fn();

  function setupTestBed(queryParams: Record<string, string> = {}): Promise<void> {
    return TestBed.configureTestingModule({
      imports: [ExpenseReviewPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({}),
              queryParamMap: convertToParamMap(queryParams),
            },
          },
        },
      ],
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(ExpenseReviewPage);
        component = fixture.componentInstance;
        http = TestBed.inject(HttpTestingController);
      });
  }

  function flushInitialLoad(page: ExpensePage = MULTI_PAGE_FIXTURE): void {
    http.expectOne(`${BASE}/trips`).flush(EXPENSE_TRIPS_FIXTURE);
    http.expectOne(`${BASE}/drivers`).flush(EXPENSE_DRIVERS_FIXTURE);
    const listReq = http.expectOne((req) => req.url === `${BASE}/expenses`);
    listReq.flush(page);
  }

  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectUrl });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectUrl });
    createObjectUrl.mockClear();
    revokeObjectUrl.mockClear();
  });

  afterEach(() => {
    http.verify();
  });

  it('carga la bandeja por revisar, cruza conductor por userId y muestra vista previa del comprobante', async () => {
    await setupTestBed();
    fixture.detectChanges();

    http.expectOne(`${BASE}/trips`).flush(EXPENSE_TRIPS_FIXTURE);
    http.expectOne(`${BASE}/drivers`).flush(EXPENSE_DRIVERS_FIXTURE);

    const listReq = http.expectOne((req) => req.url === `${BASE}/expenses`);
    expect(listReq.request.params.get('status')).toBe('REGISTERED,PENDING_SUPPORT');
    expect(listReq.request.params.get('page')).toBe('0');
    expect(listReq.request.params.get('size')).toBe('20');
    listReq.flush(MULTI_PAGE_FIXTURE);

    const evReq = http.expectOne(EVIDENCE_URL);
    expect(evReq.request.responseType).toBe('blob');
    evReq.flush(new Blob(['jpeg-bytes'], { type: 'image/jpeg' }));
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('2 por revisar');
    expect(text).toContain('TRP-000014');
    expect(text).toContain('Luis Quispe Mamani');
    expect(text).toContain('Jorge Paredes Silva');
    expect(text).toContain('recibo-combustible.jpg');

    const img = (fixture.nativeElement as HTMLElement).querySelector('.evidence-preview img');
    expect(img?.getAttribute('src')).toBe('blob:rinde-evidence-1');
  });

  it('aplica el filtro ?tripId= al llegar desde el detalle de un viaje', async () => {
    await setupTestBed({ tripId: '87460614-42ea-4cd5-9de1-8f38d9496434' });
    fixture.detectChanges();

    http.expectOne(`${BASE}/trips`).flush(EXPENSE_TRIPS_FIXTURE);
    http.expectOne(`${BASE}/drivers`).flush(EXPENSE_DRIVERS_FIXTURE);

    const listReq = http.expectOne((req) => req.url === `${BASE}/expenses`);
    expect(listReq.request.params.get('tripId')).toBe('87460614-42ea-4cd5-9de1-8f38d9496434');
    expect(listReq.request.params.has('status')).toBe(false);
    listReq.flush(EXPENSE_PAGE_FIXTURE);

    http.expectOne(EVIDENCE_URL).flush(new Blob(['jpeg'], { type: 'image/jpeg' }));
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('1 gasto');
  });

  it('permite aprobar un gasto mediante el diálogo de confirmación y observar con motivo', async () => {
    await setupTestBed();
    fixture.detectChanges();
    flushInitialLoad();
    http.expectOne(EVIDENCE_URL).flush(new Blob(['jpeg'], { type: 'image/jpeg' }));
    fixture.detectChanges();

    component.onRequestApprove(FIRST_EXPENSE);
    fixture.detectChanges();
    component.onConfirmApprove();

    const approveReq = http.expectOne(`${BASE}/expenses/${FIRST_EXPENSE.id}/status`);
    expect(approveReq.request.method).toBe('PATCH');
    expect(approveReq.request.body).toEqual({ status: 'APPROVED' });
    approveReq.flush({ ...FIRST_EXPENSE, status: 'APPROVED' });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Aprobado');

    component.onSelectExpense(SECOND_EXPENSE);
    fixture.detectChanges();

    component.onObserve({
      id: SECOND_EXPENSE.id,
      reason: 'Adjuntar boleta legible del hospedaje',
    });

    const observeReq = http.expectOne(`${BASE}/expenses/${SECOND_EXPENSE.id}/status`);
    expect(observeReq.request.body).toEqual({
      status: 'OBSERVED',
      reason: 'Adjuntar boleta legible del hospedaje',
    });
    observeReq.flush({
      ...SECOND_EXPENSE,
      status: 'OBSERVED',
      observationReason: 'Adjuntar boleta legible del hospedaje',
    });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Observado');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Adjuntar boleta legible del hospedaje',
    );
  });

  it('permite limpiar filtros desde el estado vacío y cambiar de página', async () => {
    await setupTestBed();
    fixture.detectChanges();

    flushInitialLoad({ items: [], page: 0, size: 20, totalItems: 0, totalPages: 0 });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Sin gastos para estos filtros',
    );

    component.onClearFilters();
    const clearedReq = http.expectOne((req) => req.url === `${BASE}/expenses`);
    expect(clearedReq.request.params.has('status')).toBe(false);
    clearedReq.flush({
      items: [SECOND_EXPENSE],
      page: 0,
      size: 1,
      totalItems: 2,
      totalPages: 2,
    });
    fixture.detectChanges();

    component.onPageChange(1);
    const page2Req = http.expectOne((req) => req.url === `${BASE}/expenses`);
    expect(page2Req.request.params.get('page')).toBe('1');
    page2Req.flush({
      items: [SECOND_EXPENSE],
      page: 1,
      size: 1,
      totalItems: 2,
      totalPages: 2,
    });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Página 2 de 2');
  });

  it('muestra error recuperable cuando falla la bandeja y libera la URL de evidencia al destruir', async () => {
    await setupTestBed();
    fixture.detectChanges();

    http.expectOne(`${BASE}/trips`).flush(EXPENSE_TRIPS_FIXTURE);
    http.expectOne(`${BASE}/drivers`).flush(EXPENSE_DRIVERS_FIXTURE);
    http
      .expectOne((req) => req.url === `${BASE}/expenses`)
      .flush(
        { detail: 'La fecha final no puede ser anterior a la inicial.' },
        { status: 400, statusText: 'Bad Request' },
      );
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('No pudimos cargar la bandeja');
    expect(text).toContain('La fecha final no puede ser anterior a la inicial.');

    component.retry();
    http.expectOne((req) => req.url === `${BASE}/expenses`).flush(EXPENSE_PAGE_FIXTURE);
    http.expectOne(EVIDENCE_URL).flush(new Blob(['jpeg'], { type: 'image/jpeg' }));
    fixture.detectChanges();

    fixture.destroy();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:rinde-evidence-1');
  });

  it('informa cuando la descarga del comprobante falla con error HTTP', async () => {
    await setupTestBed();
    fixture.detectChanges();
    flushInitialLoad(EXPENSE_PAGE_FIXTURE);

    http
      .expectOne(EVIDENCE_URL)
      .flush(new Blob(['{}'], { type: 'application/problem+json' }), {
        status: 404,
        statusText: 'Not Found',
      });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No fue posible cargar el comprobante.',
    );
    expect(createObjectUrl).not.toHaveBeenCalled();
  });

  it('oculta acciones de aprobación y observación cuando el gasto está bloqueado por liquidación', async () => {
    const lockedPage: ExpensePage = {
      items: [{ ...FIRST_EXPENSE, isLocked: true, evidence: null }],
      page: 0,
      size: 20,
      totalItems: 1,
      totalPages: 1,
    };

    await setupTestBed();
    fixture.detectChanges();
    flushInitialLoad(lockedPage);
    fixture.detectChanges();

    const panelText =
      (fixture.nativeElement as HTMLElement).querySelector('.detail-card')?.textContent ?? '';
    expect(panelText).toContain(
      'Este gasto pertenece a un viaje con liquidación cerrada y no admite cambios.',
    );
    expect(panelText).not.toContain('Aprobar gasto');
    expect(panelText).not.toContain('Observar gasto');
  });
});
