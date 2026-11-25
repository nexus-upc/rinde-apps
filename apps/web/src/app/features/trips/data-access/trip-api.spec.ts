import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import {
  TRIP_CONSOLIDATED_PARTIAL_FIXTURE,
  TRIP_CONSOLIDATED_SUMMARY_FIXTURE,
} from '../fixtures/trip.fixtures';
import { TripApi } from './trip-api';

const BASE = `${environment.apiBaseUrl}/api/v1`;

describe('TripApi', () => {
  let api: TripApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(TripApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests consolidated trip summary encoding the trip identifier', () => {
    let result: unknown;
    api.getTripSummary('trip/14').subscribe((value) => (result = value));

    const req = http.expectOne(`${BASE}/dashboard/trips/trip%2F14/summary`);
    expect(req.request.method).toBe('GET');
    req.flush(TRIP_CONSOLIDATED_SUMMARY_FIXTURE);

    expect(result).toEqual(TRIP_CONSOLIDATED_SUMMARY_FIXTURE);
  });

  it('handles partial consolidated trip summaries', () => {
    let result: unknown;
    api
      .getTripSummary(TRIP_CONSOLIDATED_PARTIAL_FIXTURE.tripId)
      .subscribe((value) => (result = value));

    const req = http.expectOne(
      `${BASE}/dashboard/trips/${TRIP_CONSOLIDATED_PARTIAL_FIXTURE.tripId}/summary`,
    );
    req.flush(TRIP_CONSOLIDATED_PARTIAL_FIXTURE);

    expect(result).toEqual(TRIP_CONSOLIDATED_PARTIAL_FIXTURE);
  });
});
