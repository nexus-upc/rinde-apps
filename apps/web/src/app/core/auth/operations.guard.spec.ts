import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { operationsGuard } from './operations.guard';

const STORAGE_KEY = 'rinde.accessToken';

function tokenFor(role: string): string {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return [
    btoa('{"alg":"HS256"}'),
    btoa(`{"email":"ops@rinde.test","role":"${role}","exp":${exp}}`),
    'firma-de-prueba',
  ].join('.');
}

describe('operationsGuard', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  function runGuard(): boolean | UrlTree {
    return TestBed.runInInjectionContext(() =>
      operationsGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as boolean | UrlTree;
  }

  it.each(['ADMINISTRATOR', 'OPERATIONS_MANAGER'])('lets the %s role through', (role) => {
    sessionStorage.setItem(STORAGE_KEY, tokenFor(role));

    expect(runGuard()).toBe(true);
  });

  it('sends a driver back to home', () => {
    sessionStorage.setItem(STORAGE_KEY, tokenFor('DRIVER'));

    const result = runGuard();
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/home');
  });
});
