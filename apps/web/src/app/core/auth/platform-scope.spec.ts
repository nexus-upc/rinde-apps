import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthService } from './auth.service';
import { authGuard } from './auth.guard';
import { platformGuard } from './platform.guard';
import { SessionProfileStore } from '../../features/iam/state/session-profile.store';
function token(role: string, scope?: string, tenantId?: string) {
  return (
    btoa('{}') +
    '.' +
    btoa(
      JSON.stringify({
        email: 'owner@example.invalid',
        role,
        scope,
        tenantId,
        exp: Math.floor(Date.now() / 1000) + 300,
      }),
    ) +
    '.test-signature'
  );
}
describe('Platform session boundary', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    sessionStorage.clear();
  });
  function guard(fn: CanActivateFn) {
    return TestBed.runInInjectionContext(() =>
      fn({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as boolean | UrlTree;
  }
  it('keeps platform sessions away from company pages and the company profile endpoint', () => {
    const auth = TestBed.inject(AuthService);
    auth.establish(
      {
        accessToken: token('PLATFORM_OWNER', 'PLATFORM'),
        tokenType: 'Bearer',
        expiresInSeconds: 300,
      },
      'PLATFORM',
    );
    expect(auth.user()?.scope).toBe('PLATFORM');
    expect(guard(platformGuard)).toBe(true);
    expect(TestBed.inject(Router).serializeUrl(guard(authGuard) as UrlTree)).toBe('/platform');
    const profile = TestBed.inject(SessionProfileStore);
    TestBed.tick();
    TestBed.inject(HttpTestingController).expectNone((request) =>
      request.url.endsWith('/users/me'),
    );
    expect(profile.profile()).toBeNull();
  });
  it('redirects a company administrator away from platform pages', () => {
    const auth = TestBed.inject(AuthService);
    auth.establish(
      { accessToken: token('ADMINISTRATOR'), tokenType: 'Bearer', expiresInSeconds: 300 },
      'TENANT',
    );
    expect(TestBed.inject(Router).serializeUrl(guard(platformGuard) as UrlTree)).toBe('/home');
  });
  it('does not store tokens returned for a different scope', () => {
    const auth = TestBed.inject(AuthService);
    expect(() =>
      auth.establish(
        { accessToken: token('ADMINISTRATOR'), tokenType: 'Bearer', expiresInSeconds: 300 },
        'PLATFORM',
      ),
    ).toThrow();
    expect(auth.getToken()).toBeNull();
    expect(() =>
      auth.establish(
        {
          accessToken: token('PLATFORM_OWNER', 'PLATFORM', 'company-id'),
          tokenType: 'Bearer',
          expiresInSeconds: 300,
        },
        'PLATFORM',
      ),
    ).toThrow();
    expect(auth.getToken()).toBeNull();
  });
  it('sends anonymous visitors to the dedicated platform sign-in', () => {
    expect(TestBed.inject(Router).serializeUrl(guard(platformGuard) as UrlTree)).toBe(
      '/platform/sign-in',
    );
  });
});
