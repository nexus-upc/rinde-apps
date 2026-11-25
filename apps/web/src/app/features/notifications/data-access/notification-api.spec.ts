import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import {
  NOTIFICATION_PAGE_FIXTURE,
  UNREAD_NOTIFICATION_COUNT_FIXTURE,
} from '../fixtures/notification.fixtures';
import { NotificationApi } from './notification-api';

const BASE = `${environment.apiBaseUrl}/api/v1/notifications`;

describe('NotificationApi', () => {
  let api: NotificationApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(NotificationApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests paginated notifications with query params', () => {
    let result: unknown;
    api.getNotifications({ unreadOnly: true, page: 1, size: 10 }).subscribe((v) => (result = v));

    const req = http.expectOne((request) => request.url === BASE);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('unreadOnly')).toBe('true');
    expect(req.request.params.get('type')).toBeNull();
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('10');
    req.flush(NOTIFICATION_PAGE_FIXTURE);

    expect(result).toEqual(NOTIFICATION_PAGE_FIXTURE);
  });

  it('serializes notification types as comma-separated parameter and omits empty list', () => {
    api
      .getNotifications({
        unreadOnly: true,
        type: ['EXPENSE_PENDING_REVIEW', 'INCIDENT_REPORTED'],
      })
      .subscribe();

    const filteredReq = http.expectOne((request) => request.url === BASE);
    expect(filteredReq.request.params.get('unreadOnly')).toBe('true');
    expect(filteredReq.request.params.get('type')).toBe('EXPENSE_PENDING_REVIEW,INCIDENT_REPORTED');
    filteredReq.flush(NOTIFICATION_PAGE_FIXTURE);

    api.getNotifications({ type: [] }).subscribe();

    const emptyTypeReq = http.expectOne((request) => request.url === BASE);
    expect(emptyTypeReq.request.params.has('type')).toBe(false);
    emptyTypeReq.flush(NOTIFICATION_PAGE_FIXTURE);
  });

  it('requests unread notification count', () => {
    let result: unknown;
    api.getUnreadCount().subscribe((v) => (result = v));

    const req = http.expectOne(`${BASE}/unread-count`);
    expect(req.request.method).toBe('GET');
    req.flush(UNREAD_NOTIFICATION_COUNT_FIXTURE);

    expect(result).toEqual(UNREAD_NOTIFICATION_COUNT_FIXTURE);
  });

  it('marks a notification as read encoding the id and marks all as read', () => {
    api.markAsRead('noti/1').subscribe();
    const singleReq = http.expectOne(`${BASE}/noti%2F1/read`);
    expect(singleReq.request.method).toBe('PATCH');
    singleReq.flush(null);

    api.markAllAsRead().subscribe();
    const allReq = http.expectOne(`${BASE}/read-all`);
    expect(allReq.request.method).toBe('POST');
    allReq.flush(null);
  });
});
