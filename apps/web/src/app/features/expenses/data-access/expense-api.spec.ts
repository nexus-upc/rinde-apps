import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { EXPENSE_PAGE_FIXTURE } from '../fixtures/expense.fixtures';
import { ExpenseApi } from './expense-api';

const BASE = `${environment.apiBaseUrl}/api/v1`;

describe('ExpenseApi', () => {
  let api: ExpenseApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ExpenseApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests paginated expenses tray with filters as query params', () => {
    let result: unknown;
    api
      .getExpenses({
        status: ['REGISTERED', 'PENDING_SUPPORT'],
        tripId: '87460614-42ea-4cd5-9de1-8f38d9496434',
        driverId: '764a4968-403f-40d7-9172-ba637d10fb16',
        from: '2026-11-01',
        to: '2026-11-30',
        page: 0,
        size: 20,
      })
      .subscribe((value) => (result = value));

    const req = http.expectOne((request) => request.url === `${BASE}/expenses`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('status')).toBe('REGISTERED,PENDING_SUPPORT');
    expect(req.request.params.get('tripId')).toBe('87460614-42ea-4cd5-9de1-8f38d9496434');
    expect(req.request.params.get('driverId')).toBe('764a4968-403f-40d7-9172-ba637d10fb16');
    expect(req.request.params.get('from')).toBe('2026-11-01');
    expect(req.request.params.get('to')).toBe('2026-11-30');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    req.flush(EXPENSE_PAGE_FIXTURE);

    expect(result).toEqual(EXPENSE_PAGE_FIXTURE);
  });

  it('requests expenses tray without query params when no filters are supplied', () => {
    api.getExpenses().subscribe();

    const req = http.expectOne(`${BASE}/expenses`);
    expect(req.request.params.keys().length).toBe(0);
    req.flush(EXPENSE_PAGE_FIXTURE);
  });
});
