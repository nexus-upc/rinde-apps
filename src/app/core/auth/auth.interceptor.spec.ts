import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

const STORAGE_KEY = 'rinde.accessToken';
const TRIPS_URL = `${environment.apiBaseUrl}/api/v1/trips`;
const FUTURE_TOKEN = [
  btoa('{"alg":"HS256"}'),
  btoa(
    `{"email":"admin@rinde.test","role":"ADMINISTRATOR","exp":${Math.floor(Date.now() / 1000) + 3600}}`,
  ),
  'firma-de-prueba',
].join('.');

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  function setUp(): void {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
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
    vi.restoreAllMocks();
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

  it('does not send a token to a URL that merely starts with the API text', () => {
    sessionStorage.setItem(STORAGE_KEY, FUTURE_TOKEN);
    setUp();
    const url = 'http://localhost:8000@external.test/resource';
    http.get(url).subscribe();
    const request = controller.expectOne(url);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('clears the current session on an authenticated 401', () => {
    sessionStorage.setItem(STORAGE_KEY, FUTURE_TOKEN);
    setUp();
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    http.get(TRIPS_URL).subscribe({ error: () => undefined });
    controller.expectOne(TRIPS_URL).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(TestBed.inject(AuthService).getToken()).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/sign-in');
  });

  it('does not close a new session because an earlier request returned 401 late', () => {
    sessionStorage.setItem(STORAGE_KEY, FUTURE_TOKEN);
    setUp();
    const auth = TestBed.inject(AuthService);
    http.get(TRIPS_URL).subscribe({ error: () => undefined });
    const previous = controller.expectOne(TRIPS_URL);
    auth.signIn({ email: 'new@rinde.test', password: 'Clave-de-prueba' }).subscribe();
    const replacement = FUTURE_TOKEN + '-new';
    controller
      .expectOne(`${environment.apiBaseUrl}/api/v1/auth/sign-in`)
      .flush({ accessToken: replacement, tokenType: 'Bearer', expiresInSeconds: 3600 });
    previous.flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.getToken()).toBe(replacement);
  });
});
