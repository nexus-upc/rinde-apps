import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ToastService } from '@core/feedback/toast.service';
import { environment } from '../../../../../environments/environment';
import {
  Maintenance,
  MaintenanceAlert,
  Vehicle,
  VehicleHealthStatus,
} from '../../models/fleet.models';
import { FleetPage } from './fleet-page';

const VEHICLES_URL = `${environment.apiBaseUrl}/api/v1/vehicles`;
const ALERTS_URL = `${environment.apiBaseUrl}/api/v1/maintenances/alerts`;
const MAINTENANCES_URL = `${environment.apiBaseUrl}/api/v1/maintenances`;

const MOCK_VEHICLES: Vehicle[] = [
  {
    id: 'veh-01',
    plateNumber: 'ABC-123',
    brand: 'Volvo',
    model: 'FH 540',
    modelYear: 2022,
    payloadCapacityKg: 28000,
    status: 'AVAILABLE',
    createdAt: '2026-11-01T10:00:00Z',
  },
  {
    id: 'veh-02',
    plateNumber: 'XYZ-789',
    brand: 'Scania',
    model: 'R450',
    modelYear: 2021,
    payloadCapacityKg: 30000,
    status: 'IN_TRIP',
    createdAt: '2026-11-02T11:00:00Z',
  },
];

const MOCK_ALERTS: MaintenanceAlert[] = [
  {
    vehicleId: 'veh-01',
    plateNumber: 'ABC-123',
    state: 'DUE_SOON',
    nextMaintenanceDate: '2026-11-20',
    message: 'La unidad tiene un mantenimiento próximo.',
  },
  {
    vehicleId: 'veh-02',
    plateNumber: 'XYZ-789',
    state: 'OVERDUE',
    nextMaintenanceDate: '2026-10-31',
    message: 'La unidad tiene el mantenimiento vencido.',
  },
];

const MOCK_HEALTH: VehicleHealthStatus = {
  vehicleId: 'veh-01',
  plateNumber: 'ABC-123',
  vehicleStatus: 'AVAILABLE',
  maintenanceState: 'DUE_SOON',
  nextMaintenanceDate: '2026-11-20',
  availableForTrip: true,
};

describe('FleetPage', () => {
  let fixture: ComponentFixture<FleetPage>;
  let http: HttpTestingController;
  let toasts: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FleetPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    toasts = TestBed.inject(ToastService);
    vi.spyOn(toasts, 'show');

    fixture = TestBed.createComponent(FleetPage);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
  });

  function root(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function button(label: string): HTMLButtonElement {
    return Array.from(root().querySelectorAll('button')).find((item) =>
      item.textContent?.trim().includes(label),
    ) as HTMLButtonElement;
  }

  function flushInitialLoad(vehicles = MOCK_VEHICLES, alerts = MOCK_ALERTS): void {
    http.expectOne(VEHICLES_URL).flush(vehicles);
    http.expectOne(ALERTS_URL).flush(alerts);
    fixture.detectChanges();
  }

  it('shows loading skeleton, then displays vehicle rows, tabs and count labels', () => {
    expect(root().querySelector('[aria-busy="true"]')).not.toBeNull();
    flushInitialLoad();

    const rows = root().querySelectorAll('.vehicle-row');
    expect(rows.length).toBe(2);
    expect(root().textContent).toContain('2 vehículos');
    expect(root().textContent).toContain('ABC-123');
    expect(root().textContent).toContain('Volvo FH 540');
    expect(root().textContent).toContain('Disponible');
    expect(root().textContent).toContain('Alertas de Mantenimiento');
  });

  it('switches to alerts tab and lists active maintenance alerts with badges', () => {
    flushInitialLoad();

    const alertsTab = button('Alertas de Mantenimiento');
    expect(alertsTab).toBeTruthy();
    alertsTab.click();
    fixture.detectChanges();

    expect(root().querySelector('app-maintenance-alert-list')).not.toBeNull();
    const alertRows = root().querySelectorAll('.alert-row');
    expect(alertRows.length).toBe(2);
    expect(root().textContent).toContain('La unidad tiene un mantenimiento próximo.');
    expect(root().textContent).toContain('La unidad tiene el mantenimiento vencido.');
    expect(root().textContent).toContain('Mantenimiento Próximo');
    expect(root().textContent).toContain('Mantenimiento Vencido');
  });

  it('allows registering a new vehicle and adding it to the list', () => {
    flushInitialLoad();

    button('Registrar vehículo').click();
    fixture.detectChanges();

    const plateInput = root().querySelector('#vehicle-plate') as HTMLInputElement;
    const brandInput = root().querySelector('#vehicle-brand') as HTMLInputElement;
    const modelInput = root().querySelector('#vehicle-model') as HTMLInputElement;
    const yearInput = root().querySelector('#vehicle-year') as HTMLInputElement;
    const capacityInput = root().querySelector('#vehicle-capacity') as HTMLInputElement;

    plateInput.value = 'CMR-218';
    plateInput.dispatchEvent(new Event('input'));
    brandInput.value = 'Mercedes-Benz';
    brandInput.dispatchEvent(new Event('input'));
    modelInput.value = 'Actros';
    modelInput.dispatchEvent(new Event('input'));
    yearInput.value = '2023';
    yearInput.dispatchEvent(new Event('input'));
    capacityInput.value = '25000';
    capacityInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = root().querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const req = http.expectOne({ method: 'POST', url: VEHICLES_URL });
    const created: Vehicle = {
      id: 'veh-03',
      plateNumber: 'CMR-218',
      brand: 'Mercedes-Benz',
      model: 'Actros',
      modelYear: 2023,
      payloadCapacityKg: 25000,
      status: 'AVAILABLE',
      createdAt: '2026-11-10T12:00:00Z',
    };
    req.flush(created, { status: 201, statusText: 'Created' });
    fixture.detectChanges();

    expect(toasts.show).toHaveBeenCalledWith('Vehículo CMR-218 registrado exitosamente.');
    expect(root().querySelector('app-vehicle-form')).toBeNull();
    expect(root().querySelectorAll('.vehicle-row').length).toBe(3);
  });

  it('successfully opens maintenance form, submits record and reloads data', () => {
    flushInitialLoad();

    button('Registrar mantenimiento').click();
    fixture.detectChanges();

    expect(root().querySelector('app-maintenance-form')).not.toBeNull();
    expect(root().textContent).toContain('Registrar mantenimiento técnico');

    const mileageInput = root().querySelector('#m-mileage') as HTMLInputElement;
    const costInput = root().querySelector('#m-cost') as HTMLInputElement;
    const nextDateInput = root().querySelector('#m-next') as HTMLInputElement;
    const notesInput = root().querySelector('#m-notes') as HTMLTextAreaElement;

    mileageInput.value = '130000';
    mileageInput.dispatchEvent(new Event('input'));
    costInput.value = '420.50';
    costInput.dispatchEvent(new Event('input'));
    nextDateInput.value = '2027-03-15';
    nextDateInput.dispatchEvent(new Event('input'));
    notesInput.value = 'Alineamiento y balanceo';
    notesInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = root().querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const req = http.expectOne({ method: 'POST', url: MAINTENANCES_URL });
    expect(req.request.body.mileage).toBe(130000);
    expect(req.request.body.cost).toBe(420.5);
    expect(req.request.body.nextMaintenanceDate).toBe('2027-03-15');

    const createdMaintenance: Maintenance = {
      id: 'mnt-01',
      vehicleId: req.request.body.vehicleId,
      maintenanceType: 'PREVENTIVE',
      executionDate: req.request.body.executionDate,
      mileage: 130000,
      cost: 420.5,
      nextMaintenanceDate: '2027-03-15',
      notes: 'Alineamiento y balanceo',
      createdAt: '2026-11-10T15:30:00Z',
    };
    req.flush(createdMaintenance, { status: 201, statusText: 'Created' });

    // Expect reload of vehicles and alerts
    http.expectOne(VEHICLES_URL).flush(MOCK_VEHICLES);
    http.expectOne(ALERTS_URL).flush(MOCK_ALERTS);
    fixture.detectChanges();

    expect(toasts.show).toHaveBeenCalledWith('Mantenimiento técnico registrado exitosamente.');
    expect(root().querySelector('app-maintenance-form')).toBeNull();
  });

  it('opens maintenance registration directly from the vehicle sheet (ficha)', () => {
    flushInitialLoad();

    const viewDetailBtn = root().querySelector('.vehicle-row button') as HTMLButtonElement;
    viewDetailBtn.click();
    fixture.detectChanges();

    const healthUrl = `${environment.apiBaseUrl}/api/v1/vehicles/veh-01/maintenance-status`;
    http.expectOne(healthUrl).flush(MOCK_HEALTH);
    fixture.detectChanges();

    expect(root().querySelector('app-vehicle-detail-modal')).not.toBeNull();
    const recordBtn = root().querySelector('.section__header-row button') as HTMLButtonElement;
    expect(recordBtn).toBeTruthy();
    expect(recordBtn.textContent).toContain('Registrar mantenimiento');
    recordBtn.click();
    fixture.detectChanges();

    expect(root().querySelector('app-maintenance-form')).not.toBeNull();
    const vehicleSelect = root().querySelector('#m-vehicle') as HTMLSelectElement;
    expect(vehicleSelect.value).toBe('veh-01');
  });

  it('displays error message when recording maintenance fails with API error', () => {
    flushInitialLoad();

    button('Registrar mantenimiento').click();
    fixture.detectChanges();

    const mileageInput = root().querySelector('#m-mileage') as HTMLInputElement;
    const costInput = root().querySelector('#m-cost') as HTMLInputElement;
    const nextDateInput = root().querySelector('#m-next') as HTMLInputElement;

    mileageInput.value = '50000';
    mileageInput.dispatchEvent(new Event('input'));
    costInput.value = '200';
    costInput.dispatchEvent(new Event('input'));
    nextDateInput.value = '2027-01-01';
    nextDateInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = root().querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const req = http.expectOne(MAINTENANCES_URL);
    req.flush(
      {
        type: 'about:blank',
        title: 'Bad Request',
        status: 400,
        detail: 'La fecha del próximo mantenimiento no puede ser anterior a la fecha de ejecución.',
      },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();

    const alert = root().querySelector('.form-alert');
    expect(alert?.textContent).toContain('La fecha del próximo mantenimiento no puede ser anterior a la fecha de ejecución.');
  });
});
