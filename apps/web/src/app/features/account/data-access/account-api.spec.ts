import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import {
  ACCOUNT_USER_PROFILE_FIXTURE,
  COMPANY_PROFILE_FIXTURE,
  UPDATED_COMPANY_PROFILE_FIXTURE,
} from '../fixtures/account.fixtures';
import { AccountApi } from './account-api';

const BASE = `${environment.apiBaseUrl}/api/v1`;

describe('AccountApi', () => {
  let api: AccountApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(AccountApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests and updates the current company profile', () => {
    let company: unknown;
    api.getCurrentCompany().subscribe((v) => (company = v));

    const getReq = http.expectOne(`${BASE}/tenants/current`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(COMPANY_PROFILE_FIXTURE);
    expect(company).toEqual(COMPANY_PROFILE_FIXTURE);

    let updated: unknown;
    const payload = {
      tradeName: UPDATED_COMPANY_PROFILE_FIXTURE.tradeName,
      phone: UPDATED_COMPANY_PROFILE_FIXTURE.phone,
      address: UPDATED_COMPANY_PROFILE_FIXTURE.address,
    };
    api.updateCurrentCompany(payload).subscribe((v) => (updated = v));

    const patchReq = http.expectOne(`${BASE}/tenants/current`);
    expect(patchReq.request.method).toBe('PATCH');
    expect(patchReq.request.body).toEqual(payload);
    patchReq.flush(UPDATED_COMPANY_PROFILE_FIXTURE);
    expect(updated).toEqual(UPDATED_COMPANY_PROFILE_FIXTURE);
  });

  it('updates current user profile and changes password', () => {
    let profile: unknown;
    api.updateProfile({ fullName: 'Ana Torres Vega' }).subscribe((v) => (profile = v));

    const profileReq = http.expectOne(`${BASE}/users/me`);
    expect(profileReq.request.method).toBe('PATCH');
    expect(profileReq.request.body).toEqual({ fullName: 'Ana Torres Vega' });
    profileReq.flush(ACCOUNT_USER_PROFILE_FIXTURE);
    expect(profile).toEqual(ACCOUNT_USER_PROFILE_FIXTURE);

    api
      .changePassword({
        currentPassword: 'Clave-Prueba-Actual-1',
        newPassword: 'Clave-Prueba-Nueva-2',
      })
      .subscribe();

    const passReq = http.expectOne(`${BASE}/users/me/password`);
    expect(passReq.request.method).toBe('POST');
    passReq.flush(null);
  });
});
