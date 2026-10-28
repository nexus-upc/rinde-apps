import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { DriverSummary, TripDetail, VehicleSummary } from '../models/trip.models';
import { TripDetailPage } from './trip-detail-page';

const BASE = `${environment.apiBaseUrl}/api/v1`;

const MOCK_TRIP: TripDetail = {
  id: 'trip-1',
  code: 'TRP-000001',
  origin: 'Lima',
  destination: 'Arequipa',
  cargoDescription: 'Repuestos industriales',
  cargoWeightKg: 1200,
  departureDate: '2026-11-01',
  status: 'SCHEDULED',
  vehicleId: null,
  driverId: null,
  assignedAt: null,
  overdueMaintenanceConfirmedBy: null,
  startedAt: null,
  finishedAt: null,
  statusChanges: [
    {
      status: 'SCHEDULED',
      changedAt: '2026-10-28T10:00:00Z',
      reason: 'Programación inicial',
    },
  ],
};

const MOCK_VEHICLES: VehicleSummary[] = [
  {
    id: 'veh-1',
    plateNumber: 'ABC-123',
    brand: 'Volvo',
    model: 'FH',
    modelYear: 2022,
    payloadCapacityKg: 5000,
    status: 'ACTIVE',
  },
];

const MOCK_DRIVERS: DriverSummary[] = [
  {
    id: 'drv-1',
    userId: 'usr-1',
    fullName: 'Carlos Sanchez',
    documentType: 'DNI',
    documentNumber: '12345678',
    licenseNumber: 'Q12345678',
    licenseCategory: 'A-IIIc',
    licenseExpirationDate: '2028-12-31',
    status: 'ACTIVE',
  },
];

describe('TripDetailPage', () => {
  let fixture: ComponentFixture<TripDetailPage>;
  let http: HttpTestingController;

  const root = () => fixture.nativeElement as HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TripDetailPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'trip-1' }),
            },
          },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(TripDetailPage);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function flushInitialData(trip: TripDetail = MOCK_TRIP) {
    http.expectOne(`${BASE}/trips/trip-1`).flush(trip);
    http.expectOne(`${BASE}/vehicles`).flush(MOCK_VEHICLES);
    http.expectOne(`${BASE}/drivers`).flush(MOCK_DRIVERS);
    fixture.detectChanges();
  }

  it('loads and displays trip operational details', () => {
    expect(root().textContent).toContain('Cargando viaje');
    flushInitialData();

    expect(root().textContent).toContain('TRP-000001');
    expect(root().textContent).toContain('Lima → Arequipa');
    expect(root().textContent).toContain('Repuestos industriales');
    expect(root().textContent).toContain('1200 kg');
    expect(root().textContent).toContain('Programado');
  });

  it('assigns vehicle and driver successfully', () => {
    flushInitialData();

    const submitBtn = root().querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitBtn).toBeDefined();
    submitBtn.click();
    fixture.detectChanges();

    const req = http.expectOne(`${BASE}/trips/trip-1/assignment`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      vehicleId: 'veh-1',
      driverId: 'drv-1',
      confirmOverdueMaintenance: false,
    });

    req.flush({
      id: 'trip-1',
      code: 'TRP-000001',
      status: 'ASSIGNED',
      vehicleId: 'veh-1',
      driverId: 'drv-1',
      assignedAt: '2026-10-28T12:00:00Z',
      maintenanceAlert: null,
    });
    fixture.detectChanges();

    expect(root().textContent).toContain('Asignado');
  });

  it('displays maintenance alert when response contains DUE_SOON', () => {
    flushInitialData();

    const submitBtn = root().querySelector('button[type="submit"]') as HTMLButtonElement;
    submitBtn.click();
    fixture.detectChanges();

    const req = http.expectOne(`${BASE}/trips/trip-1/assignment`);
    req.flush({
      id: 'trip-1',
      code: 'TRP-000001',
      status: 'ASSIGNED',
      vehicleId: 'veh-1',
      driverId: 'drv-1',
      assignedAt: '2026-10-28T12:00:00Z',
      maintenanceAlert: 'DUE_SOON',
    });
    fixture.detectChanges();

    expect(root().textContent).toContain('Aviso de Mantenimiento');
    expect(root().textContent).toContain('DUE_SOON');
  });
});
