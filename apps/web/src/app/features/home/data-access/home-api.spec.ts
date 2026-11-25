import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { DASHBOARD_CHARTS_FIXTURE } from '../fixtures/home.fixtures';
import { HomeApi } from './home-api';

const BASE = `${environment.apiBaseUrl}/api/v1`;

describe('HomeApi', () => {
  let api: HomeApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(HomeApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests dashboard charts with optional period filters', () => {
    let result: unknown;
    api.charts({ from: '2026-11-01', to: '2026-11-30' }).subscribe((v) => (result = v));

    const req = http.expectOne((request) => request.url === `${BASE}/dashboard/charts`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('from')).toBe('2026-11-01');
    expect(req.request.params.get('to')).toBe('2026-11-30');
    req.flush(DASHBOARD_CHARTS_FIXTURE);

    expect(result).toEqual(DASHBOARD_CHARTS_FIXTURE);
  });
});
