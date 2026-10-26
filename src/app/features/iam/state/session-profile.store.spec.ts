import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '@core/auth/auth.service';
import { environment } from '../../../../environments/environment';
import { SessionProfileStore } from './session-profile.store';

const token = `${btoa('{"alg":"HS256"}')}.${btoa(JSON.stringify({ email: 'ana@rinde.test', role: 'ADMINISTRATOR', exp: Math.floor(Date.now() / 1000) + 3600 }))}.signature`;
const url = `${environment.apiBaseUrl}/api/v1/users/me`;

describe('SessionProfileStore', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    sessionStorage.setItem('rinde.accessToken', token);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('loads the signed-in profile and clears it on sign-out', () => {
    const store = TestBed.inject(SessionProfileStore);
    TestBed.tick();
    http.expectOne(url).flush({ fullName: 'Ana', tenant: { tradeName: 'Andes' } });
    expect(store.profile()?.fullName).toBe('Ana');
    TestBed.inject(AuthService).signOut();
    TestBed.tick();
    expect(store.profile()).toBeNull();
  });
  it('cancels a pending profile request when its session ends', () => {
    const store = TestBed.inject(SessionProfileStore);
    TestBed.tick();
    const pending = http.expectOne(url);
    TestBed.inject(AuthService).signOut();
    TestBed.tick();
    expect(pending.cancelled).toBe(true);
    expect(store.profile()).toBeNull();
  });
});
