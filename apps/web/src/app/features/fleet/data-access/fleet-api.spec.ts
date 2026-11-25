import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { VEHICLE_HISTORY_FIXTURE } from '../fixtures/fleet.fixtures';
import { FleetApi } from './fleet-api';

const BASE = `${environment.apiBaseUrl}/api/v1`;

describe('FleetApi', () => {
  let api: FleetApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(FleetApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests vehicle history encoding vehicleId and passing optional date filters', () => {
    let result: unknown;
    api
      .getVehicleHistory('veh/01', { from: '2026-09-01', to: '2026-11-25' })
      .subscribe((value) => (result = value));

    const req = http.expectOne((request) => request.url === `${BASE}/vehicles/veh%2F01/history`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('from')).toBe('2026-09-01');
    expect(req.request.params.get('to')).toBe('2026-11-25');
    req.flush(VEHICLE_HISTORY_FIXTURE);

    expect(result).toEqual(VEHICLE_HISTORY_FIXTURE);
  });
});
