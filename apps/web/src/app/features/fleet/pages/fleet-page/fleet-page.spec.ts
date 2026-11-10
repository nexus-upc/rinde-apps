import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ToastService } from '@core/feedback/toast.service';
import { environment } from '../../../../../environments/environment';
import { Vehicle, VehicleHealthStatus } from '../../models/fleet.models';
import { FleetPage } from './fleet-page';

const VEHICLES_URL = `${environment.apiBaseUrl}/api/v1/vehicles`;

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

  it('shows loading skeleton, then displays vehicle rows and count label', () => {
    expect(root().querySelector('[aria-busy="true"]')).not.toBeNull();
    http.expectOne(VEHICLES_URL).flush(MOCK_VEHICLES);
    fixture.detectChanges();

    const rows = root().querySelectorAll('.vehicle-row');
    expect(rows.length).toBe(2);
    expect(root().textContent).toContain('2 vehículos');
    expect(root().textContent).toContain('ABC-123');
    expect(root().textContent).toContain('Volvo FH 540');
    expect(root().textContent).toContain('Disponible');
    expect(root().textContent).toContain('En Viaje');
  });

  it('allows opening and cancelling the registration form', () => {
    http.expectOne(VEHICLES_URL).flush(MOCK_VEHICLES);
    fixture.detectChanges();

    const openBtn = button('Registrar vehículo');
    expect(openBtn).toBeTruthy();
    openBtn.click();
    fixture.detectChanges();

    expect(root().querySelector('app-vehicle-form')).not.toBeNull();
    expect(root().textContent).toContain('Registrar nuevo vehículo');

    const cancelBtn = button('Cancelar');
    expect(cancelBtn).toBeTruthy();
    cancelBtn.click();
    fixture.detectChanges();

    expect(root().querySelector('app-vehicle-form')).toBeNull();
  });

  it('successfully registers a new vehicle and adds it to the list', () => {
    http.expectOne(VEHICLES_URL).flush(MOCK_VEHICLES);
    fixture.detectChanges();

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
    expect(req.request.body).toEqual({
      plateNumber: 'CMR-218',
      brand: 'Mercedes-Benz',
      model: 'Actros',
      modelYear: 2023,
      payloadCapacityKg: 25000,
    });

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
    expect(root().textContent).toContain('CMR-218');
  });

  it('displays the server error message when vehicle plate is duplicate (409)', () => {
    http.expectOne(VEHICLES_URL).flush(MOCK_VEHICLES);
    fixture.detectChanges();

    button('Registrar vehículo').click();
    fixture.detectChanges();

    const plateInput = root().querySelector('#vehicle-plate') as HTMLInputElement;
    const brandInput = root().querySelector('#vehicle-brand') as HTMLInputElement;
    const modelInput = root().querySelector('#vehicle-model') as HTMLInputElement;
    const yearInput = root().querySelector('#vehicle-year') as HTMLInputElement;
    const capacityInput = root().querySelector('#vehicle-capacity') as HTMLInputElement;

    plateInput.value = 'ABC-123';
    plateInput.dispatchEvent(new Event('input'));
    brandInput.value = 'Volvo';
    brandInput.dispatchEvent(new Event('input'));
    modelInput.value = 'FH 540';
    modelInput.dispatchEvent(new Event('input'));
    yearInput.value = '2022';
    yearInput.dispatchEvent(new Event('input'));
    capacityInput.value = '28000';
    capacityInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = root().querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const req = http.expectOne(VEHICLES_URL);
    req.flush(
      {
        type: 'about:blank',
        title: 'Conflict',
        status: 409,
        detail: 'La placa ya se encuentra registrada en la empresa.',
      },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    const alert = root().querySelector('.form-alert');
    expect(alert?.textContent).toContain('La placa ya se encuentra registrada en la empresa.');
  });

  it('opens vehicle sheet (ficha) and loads maintenance health status', () => {
    http.expectOne(VEHICLES_URL).flush(MOCK_VEHICLES);
    fixture.detectChanges();

    const viewDetailBtn = root().querySelector('.vehicle-row button') as HTMLButtonElement;
    expect(viewDetailBtn.textContent).toContain('Ver Ficha');
    viewDetailBtn.click();
    fixture.detectChanges();

    const healthUrl = `${environment.apiBaseUrl}/api/v1/vehicles/veh-01/maintenance-status`;
    const healthReq = http.expectOne(healthUrl);
    healthReq.flush(MOCK_HEALTH);
    fixture.detectChanges();

    expect(root().querySelector('app-vehicle-detail-modal')).not.toBeNull();
    expect(root().textContent).toContain('Ficha de Unidad: ABC-123');
    expect(root().textContent).toContain('Mantenimiento Próximo');
    expect(root().textContent).toContain('Habilitado para asignación');
    expect(root().textContent).toContain('Historial de mantenimiento no disponible.');

    const closeBtn = root().querySelector('.modal-footer button') as HTMLButtonElement;
    closeBtn.click();
    fixture.detectChanges();

    expect(root().querySelector('.modal-backdrop')).toBeNull();
  });

  it('shows error state panel when loading fails and supports retry', () => {
    http.expectOne(VEHICLES_URL).flush('Error', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(root().textContent).toContain('No se pudo cargar la flota');

    const retryBtn = button('Reintentar');
    expect(retryBtn).toBeTruthy();
    retryBtn.click();
    fixture.detectChanges();

    http.expectOne(VEHICLES_URL).flush(MOCK_VEHICLES);
    fixture.detectChanges();

    expect(root().querySelectorAll('.vehicle-row').length).toBe(2);
  });
});
