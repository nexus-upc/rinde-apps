import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

const STORAGE_KEY = 'rinde.accessToken';
const SIGN_IN_URL = `${environment.apiBaseUrl}/api/v1/auth/sign-in`;

/** Construye un JWT con firma ficticia; el cliente solo lee el payload. */
function buildToken(claims: Record<string, unknown>): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(claims)}.firma-de-prueba`;
}

const futureExp = Math.floor(Date.now() / 1000) + 3600;

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    http.verify();
    sessionStorage.clear();
  });

  it('stores the token in sessionStorage after a successful sign-in', () => {
    const token = buildToken({ email: 'admin@rinde.test', role: 'ADMINISTRATOR', exp: futureExp });

    service.signIn({ email: 'admin@rinde.test', password: 'clave-de-prueba' }).subscribe();

    const req = http.expectOne(SIGN_IN_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'admin@rinde.test', password: 'clave-de-prueba' });
    req.flush({ accessToken: token, tokenType: 'Bearer', expiresInSeconds: 28800 });

    expect(sessionStorage.getItem(STORAGE_KEY)).toBe(token);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()).toEqual({ email: 'admin@rinde.test', role: 'ADMINISTRATOR' });
    expect(service.roleLabel()).toBe('Administrador');
  });

  it('does not store anything when the sign-in fails', () => {
    service.signIn({ email: 'admin@rinde.test', password: 'incorrecta' }).subscribe({
      error: () => undefined,
    });

    http.expectOne(SIGN_IN_URL).flush(
      { detail: 'El correo o la contraseña son incorrectos.' },
      {
        status: 401,
        statusText: 'Unauthorized',
      },
    );

    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('restores the session from sessionStorage when a new service starts', () => {
    const token = buildToken({ email: 'ana@rinde.test', role: 'DRIVER', exp: futureExp });
    sessionStorage.setItem(STORAGE_KEY, token);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    const restored = TestBed.inject(AuthService);

    expect(restored.isAuthenticated()).toBe(true);
    expect(restored.getToken()).toBe(token);
  });

  it('discards an expired token found in sessionStorage', () => {
    const expired = buildToken({
      email: 'ana@rinde.test',
      role: 'DRIVER',
      exp: Math.floor(Date.now() / 1000) - 60,
    });
    sessionStorage.setItem(STORAGE_KEY, expired);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    const restored = TestBed.inject(AuthService);

    expect(restored.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('clears the token on sign-out', () => {
    const token = buildToken({ email: 'admin@rinde.test', role: 'ADMINISTRATOR', exp: futureExp });
    service.signIn({ email: 'admin@rinde.test', password: 'clave-de-prueba' }).subscribe();
    http
      .expectOne(SIGN_IN_URL)
      .flush({ accessToken: token, tokenType: 'Bearer', expiresInSeconds: 28800 });

    service.signOut();

    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
  });

  it('discards a token that expires while the application remains open', () => {
    const token = buildToken({ email: 'admin@rinde.test', role: 'ADMINISTRATOR', exp: futureExp });
    service.signIn({ email: 'admin@rinde.test', password: 'clave-de-prueba' }).subscribe();
    http
      .expectOne(SIGN_IN_URL)
      .flush({ accessToken: token, tokenType: 'Bearer', expiresInSeconds: 3600 });
    vi.spyOn(Date, 'now').mockReturnValue((futureExp + 1) * 1000);
    expect(service.getToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
