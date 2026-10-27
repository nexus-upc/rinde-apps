import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PlatformStore } from './platform.store';
const company = {
  id: 'company',
  tradeName: 'Transportes de prueba',
  ruc: '20123456789',
  status: 'ACTIVE',
  accessSuspended: false,
};
describe('PlatformStore', () => {
  let store: PlatformStore;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PlatformStore, provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(PlatformStore);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  const page = { items: [company], page: 0, size: 20, total: 1 };
  it('uses server pagination and the submitted company search', () => {
    store.init('companies');
    http.expectOne((r) => r.url.endsWith('/companies')).flush(page);
    store.search('  Transportes  ');
    const request = http.expectOne(
      (r) => r.url.endsWith('/companies') && r.params.get('search') === 'Transportes',
    );
    expect(request.request.params.get('page')).toBe('0');
    request.flush(page);
    expect(store.companies()).toEqual([company]);
    expect(store.pagination().total).toBe(1);
  });
  it('recovers after an unavailable API without inventing overview values', () => {
    store.init('companies');
    http
      .expectOne((r) => r.url.endsWith('/companies'))
      .flush({ detail: 'Servicio no disponible' }, { status: 503, statusText: 'Unavailable' });
    expect(store.request.error()).toBe('Servicio no disponible');
    expect(store.ready()).toBe(false);
    store.load();
    http.expectOne((r) => r.url.endsWith('/companies')).flush(page);
    expect(store.ready()).toBe(true);
    expect(store.request.error()).toBeNull();
  });
  it('submits one reasoned access change and reloads the confirmed state', () => {
    store.init('companies');
    http.expectOne((r) => r.url.endsWith('/companies')).flush(page);
    let done = 0;
    store.changeAccess(company, 'Solicitud de soporte', () => done++);
    store.changeAccess(company, 'Otra solicitud', () => done++);
    const request = http.expectOne((r) => r.url.endsWith('/companies/company/access'));
    expect(request.request.body).toEqual({ suspended: true, reason: 'Solicitud de soporte' });
    request.flush({ ...company, accessSuspended: true });
    http
      .expectOne((r) => r.url.endsWith('/companies'))
      .flush({ ...page, items: [{ ...company, accessSuspended: true }] });
    expect(done).toBe(1);
    expect(store.companies()[0]?.accessSuspended).toBe(true);
  });
});
