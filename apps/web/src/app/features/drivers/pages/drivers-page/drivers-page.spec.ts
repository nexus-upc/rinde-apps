import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ToastService } from '@core/feedback/toast.service';
import { environment } from '../../../../../environments/environment';
import { Driver, DriverEligibility, DriverUserAccount } from '../../models/driver.models';
import { DriversPage } from './drivers-page';

const DRIVERS_URL = `${environment.apiBaseUrl}/api/v1/drivers`;
const ACCOUNTS_URL = `${environment.apiBaseUrl}/api/v1/users?role=DRIVER`;

const MOCK_DRIVERS: Driver[] = [
  {
    id: 'drv-01',
    userId: 'usr-01',
    fullName: 'Luis Quispe Mamani',
    documentType: 'DNI',
    documentNumber: '71234567',
    licenseNumber: 'Q12345678',
    licenseCategory: 'A-IIb',
    licenseExpirationDate: '2030-12-31',
    status: 'ENABLED',
    createdAt: '2026-11-01T10:00:00Z',
  },
  {
    id: 'drv-02',
    userId: null,
    fullName: 'Jorge Salas Vargas',
    documentType: 'DNI',
    documentNumber: '45678901',
    licenseNumber: 'Q87654321',
    licenseCategory: 'A-IIIc',
    licenseExpirationDate: '2029-06-30',
    status: 'ENABLED',
    createdAt: '2026-11-02T11:00:00Z',
  },
];

const MOCK_ACCOUNTS: DriverUserAccount[] = [
  {
    id: 'usr-01',
    fullName: 'Luis Quispe Mamani',
    email: 'luis@andes.pe',
    role: 'DRIVER',
    status: 'ACTIVE',
  },
  {
    id: 'usr-02',
    fullName: 'Rosa Medina Flores',
    email: 'rosa@andes.pe',
    role: 'DRIVER',
    status: 'ACTIVE',
  },
  {
    id: 'usr-03',
    fullName: 'Marco Ríos Torres',
    email: 'marco@andes.pe',
    role: 'DRIVER',
    status: 'INVITED', // Debería ser filtrada del selector
  },
];

const MOCK_ELIGIBILITY: DriverEligibility = {
  driverId: 'drv-01',
  eligible: true,
  driverStatus: 'ENABLED',
  licenseStatus: 'VALID',
  reason: 'Conductor habilitado.',
};

describe('DriversPage', () => {
  let fixture: ComponentFixture<DriversPage>;
  let http: HttpTestingController;
  let toasts: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DriversPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    toasts = TestBed.inject(ToastService);
    vi.spyOn(toasts, 'show');

    fixture = TestBed.createComponent(DriversPage);
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

  it('shows loading skeleton, then displays driver rows and count label', () => {
    expect(root().querySelector('[aria-busy="true"]')).not.toBeNull();
    http.expectOne(DRIVERS_URL).flush(MOCK_DRIVERS);
    http.expectOne(ACCOUNTS_URL).flush(MOCK_ACCOUNTS);
    fixture.detectChanges();

    const rows = root().querySelectorAll('.driver-row');
    expect(rows.length).toBe(2);
    expect(root().textContent).toContain('2 conductores');
    expect(root().textContent).toContain('Luis Quispe Mamani');
    expect(root().textContent).toContain('Jorge Salas Vargas');
    expect(root().textContent).toContain('Cuenta vinculada');
    expect(root().textContent).toContain('Sin cuenta de acceso');
  });

  it('filters out non-active accounts in the DRIVER selector', () => {
    http.expectOne(DRIVERS_URL).flush(MOCK_DRIVERS);
    http.expectOne(ACCOUNTS_URL).flush(MOCK_ACCOUNTS);
    fixture.detectChanges();

    button('Registrar conductor').click();
    http.expectOne(ACCOUNTS_URL).flush(MOCK_ACCOUNTS);
    fixture.detectChanges();

    const select = root().querySelector('#driver-account') as HTMLSelectElement;
    expect(select).not.toBeNull();
    const options = Array.from(select.querySelectorAll('option'));
    // 1 default "Sin vincular" + 2 active accounts (usr-01, usr-02) -> 3 options total
    expect(options.length).toBe(3);
    expect(select.textContent).toContain('Luis Quispe Mamani');
    expect(select.textContent).toContain('Rosa Medina Flores');
    expect(select.textContent).not.toContain('Marco Ríos Torres'); // INVITED está excluido
  });

  it('successfully registers a driver with linked DRIVER account and updates the list', () => {
    http.expectOne(DRIVERS_URL).flush(MOCK_DRIVERS);
    http.expectOne(ACCOUNTS_URL).flush(MOCK_ACCOUNTS);
    fixture.detectChanges();

    button('Registrar conductor').click();
    http.expectOne(ACCOUNTS_URL).flush(MOCK_ACCOUNTS);
    fixture.detectChanges();

    const accountSelect = root().querySelector('#driver-account') as HTMLSelectElement;
    const nameInput = root().querySelector('#driver-name') as HTMLInputElement;
    const docNumberInput = root().querySelector('#driver-doc-number') as HTMLInputElement;
    const licenseNumberInput = root().querySelector('#driver-license') as HTMLInputElement;
    const expirationInput = root().querySelector('#driver-expiration') as HTMLInputElement;

    accountSelect.value = 'usr-02';
    accountSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(nameInput.value).toBe('Rosa Medina Flores');

    docNumberInput.value = '72345678';
    docNumberInput.dispatchEvent(new Event('input'));
    licenseNumberInput.value = 'Q99887766';
    licenseNumberInput.dispatchEvent(new Event('input'));
    expirationInput.value = '2031-10-15';
    expirationInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = root().querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const req = http.expectOne({ method: 'POST', url: DRIVERS_URL });
    expect(req.request.body).toEqual({
      userId: 'usr-02',
      fullName: 'Rosa Medina Flores',
      documentType: 'DNI',
      documentNumber: '72345678',
      licenseNumber: 'Q99887766',
      licenseCategory: 'A-IIb',
      licenseExpirationDate: '2031-10-15',
    });

    const created: Driver = {
      id: 'drv-03',
      userId: 'usr-02',
      fullName: 'Rosa Medina Flores',
      documentType: 'DNI',
      documentNumber: '72345678',
      licenseNumber: 'Q99887766',
      licenseCategory: 'A-IIb',
      licenseExpirationDate: '2031-10-15',
      status: 'ENABLED',
      createdAt: '2026-11-10T12:00:00Z',
    };
    req.flush(created, { status: 201, statusText: 'Created' });
    fixture.detectChanges();

    expect(toasts.show).toHaveBeenCalledWith('Conductor Rosa Medina Flores registrado exitosamente.');
    expect(root().querySelector('app-driver-form')).toBeNull();
    expect(root().querySelectorAll('.driver-row').length).toBe(3);
    expect(root().textContent).toContain('Rosa Medina Flores');
  });

  it('displays API conflict error when the linked account is not active or is already linked (409)', () => {
    http.expectOne(DRIVERS_URL).flush(MOCK_DRIVERS);
    http.expectOne(ACCOUNTS_URL).flush(MOCK_ACCOUNTS);
    fixture.detectChanges();

    button('Registrar conductor').click();
    http.expectOne(ACCOUNTS_URL).flush(MOCK_ACCOUNTS);
    fixture.detectChanges();

    const nameInput = root().querySelector('#driver-name') as HTMLInputElement;
    const docNumberInput = root().querySelector('#driver-doc-number') as HTMLInputElement;
    const licenseNumberInput = root().querySelector('#driver-license') as HTMLInputElement;
    const expirationInput = root().querySelector('#driver-expiration') as HTMLInputElement;

    nameInput.value = 'Carlos Ramos';
    nameInput.dispatchEvent(new Event('input'));
    docNumberInput.value = '70112233';
    docNumberInput.dispatchEvent(new Event('input'));
    licenseNumberInput.value = 'Q11223344';
    licenseNumberInput.dispatchEvent(new Event('input'));
    expirationInput.value = '2030-05-20';
    expirationInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = root().querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const req = http.expectOne(DRIVERS_URL);
    req.flush(
      {
        type: 'about:blank',
        title: 'Conflict',
        status: 409,
        detail: 'La cuenta del conductor no está activa.',
      },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    const alert = root().querySelector('.form-alert');
    expect(alert?.textContent).toContain('La cuenta del conductor no está activa.');
  });

  it('opens driver sheet (ficha) and loads technical eligibility status', () => {
    http.expectOne(DRIVERS_URL).flush(MOCK_DRIVERS);
    http.expectOne(ACCOUNTS_URL).flush(MOCK_ACCOUNTS);
    fixture.detectChanges();

    const viewDetailBtn = root().querySelector('.driver-row button') as HTMLButtonElement;
    expect(viewDetailBtn.textContent).toContain('Ver Ficha');
    viewDetailBtn.click();
    fixture.detectChanges();

    const eligUrl = `${environment.apiBaseUrl}/api/v1/drivers/drv-01/eligibility`;
    const eligReq = http.expectOne(eligUrl);
    eligReq.flush(MOCK_ELIGIBILITY);
    fixture.detectChanges();

    expect(root().querySelector('app-driver-detail-modal')).not.toBeNull();
    expect(root().textContent).toContain('Ficha de Conductor: Luis Quispe Mamani');
    expect(root().textContent).toContain('Habilitado para asignar');
    expect(root().textContent).toContain('Conductor habilitado.');
    expect(root().textContent).toContain('Cuenta Activa Vinculada');

    const closeBtn = root().querySelector('.modal-footer button') as HTMLButtonElement;
    closeBtn.click();
    fixture.detectChanges();

    expect(root().querySelector('.modal-backdrop')).toBeNull();
  });

  it('handles load failure with error state panel and retry', () => {
    http.expectOne(DRIVERS_URL).flush('Error', { status: 500, statusText: 'Server Error' });
    http.expectOne(ACCOUNTS_URL).flush(MOCK_ACCOUNTS);
    fixture.detectChanges();

    expect(root().textContent).toContain('No se pudo cargar la lista de conductores');

    const retryBtn = button('Reintentar');
    expect(retryBtn).toBeTruthy();
    retryBtn.click();
    fixture.detectChanges();

    http.expectOne(DRIVERS_URL).flush(MOCK_DRIVERS);
    http.expectOne(ACCOUNTS_URL).flush(MOCK_ACCOUNTS);
    fixture.detectChanges();

    expect(root().querySelectorAll('.driver-row').length).toBe(2);
  });
});
