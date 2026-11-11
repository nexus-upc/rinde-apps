import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { Incident } from '../../models/incident.models';
import { IncidentsPage } from './incidents-page';

const BASE = `${environment.apiBaseUrl}/api/v1`;

const MOCK_INCIDENTS: Incident[] = [
  {
    id: 'inc-1',
    tripId: 'trip-1',
    vehicleId: 'veh-1',
    reportedBy: 'conductor@example.test',
    type: 'BREAKDOWN',
    description: 'Falla en neumático posterior derecho en Panamericana Sur',
    evidenceUrl: 'https://cdn.example.com/evidencias/inc-1.jpg',
    status: 'OPEN',
    reportedAt: '2026-11-11T10:00:00Z',
    resolution: null,
    updatedAt: '2026-11-11T10:00:00Z',
  },
  {
    id: 'inc-2',
    tripId: 'trip-2',
    vehicleId: 'veh-2',
    reportedBy: 'conductor2@example.test',
    type: 'DELAY',
    description: 'Desvío por mantenimiento vial en la sierra central',
    evidenceUrl: null,
    status: 'CLOSED',
    reportedAt: '2026-11-10T15:30:00Z',
    resolution: {
      action: 'Se coordinó nueva ventana de entrega con almacén destino.',
      closedBy: 'ops@example.test',
      closedAt: '2026-11-10T18:00:00Z',
    },
    updatedAt: '2026-11-10T18:00:00Z',
  },
];

describe('IncidentsPage', () => {
  let fixture: ComponentFixture<IncidentsPage>;
  let http: HttpTestingController;

  const root = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncidentsPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({}),
              queryParamMap: convertToParamMap({}),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IncidentsPage);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  function flushInitial(incidents: Incident[] = MOCK_INCIDENTS): void {
    http.expectOne(`${BASE}/trips`).flush([
      { id: 'trip-1', code: 'TRP-000101', origin: 'Lima', destination: 'Ica' },
    ]);
    http.expectOne(`${BASE}/vehicles`).flush([
      { id: 'veh-1', plateNumber: 'ABC-123', brand: 'Volvo', model: 'FH' },
    ]);
    http.expectOne(`${BASE}/incidents`).flush(incidents);
    fixture.detectChanges();
  }

  it('loads incidents list and renders direct evidenceUrl link', () => {
    fixture.detectChanges();
    flushInitial();

    const text = root().textContent ?? '';
    expect(text).toContain('Incidencias');
    expect(text).toContain('2 incidencias');
    expect(text).toContain('Falla en neumático posterior derecho');
    expect(text).toContain('TRP-000101 · Lima → Ica');
    expect(text).toContain('ABC-123 · Volvo FH');

    const evidenceAnchor = root().querySelector(
      'a[href="https://cdn.example.com/evidencias/inc-1.jpg"]',
    );
    expect(evidenceAnchor).not.toBeNull();
  });

  it('filters incidents by status, tripId, and vehicleId', () => {
    fixture.detectChanges();
    flushInitial();

    const statusSelect = root().querySelector('#incident-status-filter') as HTMLSelectElement;
    statusSelect.value = 'IN_PROGRESS';
    statusSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const reqStatus = http.expectOne(`${BASE}/incidents?status=IN_PROGRESS`);
    expect(reqStatus.request.method).toBe('GET');
    reqStatus.flush([]);
    fixture.detectChanges();

    const tripInput = root().querySelector('#incident-trip-filter') as HTMLInputElement;
    tripInput.value = 'trip-1';
    tripInput.dispatchEvent(new Event('input'));

    const vehicleInput = root().querySelector('#incident-vehicle-filter') as HTMLInputElement;
    vehicleInput.value = 'veh-1';
    vehicleInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const filterForm = root().querySelector('form.filters-card') as HTMLFormElement;
    filterForm.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const reqCombined = http.expectOne(
      `${BASE}/incidents?status=IN_PROGRESS&tripId=trip-1&vehicleId=veh-1`,
    );
    reqCombined.flush([MOCK_INCIDENTS[0]!]);
    fixture.detectChanges();

    expect(root().textContent).toContain('1 incidencia');

    const clearBtn = Array.from(root().querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Limpiar',
    );
    clearBtn?.click();
    fixture.detectChanges();

    const reqReset = http.expectOne(`${BASE}/incidents`);
    reqReset.flush(MOCK_INCIDENTS);
    fixture.detectChanges();

    expect(root().textContent).toContain('2 incidencias');
  });

  it('opens detail modal, transitions OPEN incident to IN_PROGRESS, and displays 409 API errors', () => {
    fixture.detectChanges();
    flushInitial();

    const detailBtn = Array.from(root().querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Ver detalle'),
    );
    detailBtn?.click();
    fixture.detectChanges();

    const reqDetail = http.expectOne(`${BASE}/incidents/inc-1`);
    expect(reqDetail.request.method).toBe('GET');
    reqDetail.flush(MOCK_INCIDENTS[0]!);
    fixture.detectChanges();

    const detailDialog = root().querySelector('[aria-labelledby="incident-detail-title"]');
    expect(detailDialog?.textContent).toContain('https://cdn.example.com/evidencias/inc-1.jpg');

    const progressBtn = Array.from(detailDialog!.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Pasar a En atención'),
    );
    progressBtn?.click();
    fixture.detectChanges();

    const reqPatch = http.expectOne(`${BASE}/incidents/inc-1/status`);
    expect(reqPatch.request.method).toBe('PATCH');
    expect(reqPatch.request.body).toEqual({ status: 'IN_PROGRESS' });
    reqPatch.flush(
      { detail: 'Solo una incidencia abierta puede pasar a atención.' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(root().textContent).toContain(
      'Solo una incidencia abierta puede pasar a atención.',
    );

    progressBtn?.click();
    fixture.detectChanges();

    http.expectOne(`${BASE}/incidents/inc-1/status`).flush({
      ...MOCK_INCIDENTS[0]!,
      status: 'IN_PROGRESS',
    });
    fixture.detectChanges();

    expect(detailDialog?.textContent).toContain('En atención');
  });

  it('closes incident with action, displays closedAt and closedBy, and handles 409 on already closed incident', () => {
    fixture.detectChanges();
    flushInitial();

    const closeBtn = Array.from(root().querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Cerrar',
    );
    closeBtn?.click();
    fixture.detectChanges();

    const closeForm = root().querySelector(
      'form[aria-labelledby="incident-close-title"]',
    ) as HTMLFormElement;
    const actionTextarea = root().querySelector('#incident-close-action') as HTMLTextAreaElement;
    actionTextarea.value = 'Se reemplazó el neumático dañado y continuó la ruta.';
    actionTextarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    closeForm.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const reqConflict = http.expectOne(`${BASE}/incidents/inc-1/close`);
    expect(reqConflict.request.method).toBe('POST');
    expect(reqConflict.request.body).toEqual({
      action: 'Se reemplazó el neumático dañado y continuó la ruta.',
    });
    reqConflict.flush(
      { detail: 'La incidencia ya está cerrada.' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(root().textContent).toContain('La incidencia ya está cerrada.');

    closeForm.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    http.expectOne(`${BASE}/incidents/inc-1/close`).flush({
      ...MOCK_INCIDENTS[0]!,
      status: 'CLOSED',
      resolution: {
        action: 'Se reemplazó el neumático dañado y continuó la ruta.',
        closedBy: 'admin@example.test',
        closedAt: '2026-11-11T14:30:00Z',
      },
      updatedAt: '2026-11-11T14:30:00Z',
    });
    fixture.detectChanges();

    const detailDialog = root().querySelector('[aria-labelledby="incident-detail-title"]');
    expect(detailDialog).not.toBeNull();
    expect(detailDialog?.textContent).toContain('Resolución y cierre');
    expect(detailDialog?.textContent).toContain('admin@example.test');
    expect(detailDialog?.textContent).toContain(
      'Se reemplazó el neumático dañado y continuó la ruta.',
    );
  });
});
