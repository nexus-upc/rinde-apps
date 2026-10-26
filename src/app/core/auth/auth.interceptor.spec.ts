import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { authInterceptor } from './auth.interceptor';

const STORAGE_KEY = 'rinde.accessToken';
const TRIPS_URL = `${environment.apiBaseUrl}/api/v1/trips`;
const FUTURE_TOKEN = [
  btoa('{"alg":"HS256"}'),
  btoa(`{"email":"admin@rinde.test","role":"ADMINISTRATOR","exp":${Math.floor(Date.now() / 1000) + 3600}}`),
  'firma-de-prueba',
].join('.');

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  function setUp(): void {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  }

  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    controller.verify();
    sessionStorage.clear();
  });

  it('adds the Bearer header to backend requests when there is a session', () => {
    sessionStorage.setItem(STORAGE_KEY, FUTURE_TOKEN);
    setUp();

    http.get(TRIPS_URL).subscribe();

    const req = controller.expectOne(TRIPS_URL);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${FUTURE_TOKEN}`);
    req.flush([]);
  });

  it('does not add the header to requests to other hosts', () => {
    sessionStorage.setItem(STORAGE_KEY, FUTURE_TOKEN);
    setUp();

    http.get('https://ejemplo.test/recurso').subscribe();

    const req = controller.expectOne('https://ejemplo.test/recurso');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('sends the request without the header when there is no session', () => {
    setUp();

    http.get(TRIPS_URL).subscribe();

    const req = controller.expectOne(TRIPS_URL);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });
});
