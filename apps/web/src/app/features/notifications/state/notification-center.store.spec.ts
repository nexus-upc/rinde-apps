import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DestroyRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ToastService } from '@core/feedback/toast.service';
import { environment } from '../../../../environments/environment';
import {
  NOTIFICATION_PAGE_FIXTURE,
  UNREAD_NOTIFICATION_COUNT_FIXTURE,
} from '../fixtures/notification.fixtures';
import { NotificationPage } from '../models/notification.models';
import { NotificationCenterStore, UNREAD_REFRESH_INTERVAL_MS } from './notification-center.store';

const BASE = `${environment.apiBaseUrl}/api/v1/notifications`;
const COUNT_URL = `${BASE}/unread-count`;
const EMPTY_PAGE: NotificationPage = { items: [], page: 0, size: 20, totalItems: 0, totalPages: 0 };

function setVisibility(state: 'visible' | 'hidden'): void {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
}

function restoreVisibility(): void {
  delete (document as unknown as { visibilityState?: string }).visibilityState;
}

describe('NotificationCenterStore', () => {
  let store: NotificationCenterStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(NotificationCenterStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
    restoreVisibility();
  });

  /** Carga la primera página con la respuesta indicada. */
  function loadPage(page: NotificationPage = NOTIFICATION_PAGE_FIXTURE): void {
    store.load();
    http.expectOne((request) => request.url === BASE).flush(page);
  }

  /** Aviso en la posición indicada de la lista cargada. */
  function itemAt(index: number) {
    const item = store.items().at(index);
    if (!item) throw new Error(`No hay aviso en la posición ${index}.`);
    return item;
  }

  /** Lee el contador de la campana con la respuesta indicada. */
  function loadCount(count: number): void {
    store.refreshUnreadCount();
    http.expectOne(COUNT_URL).flush({ count });
  }

  it('loads the first page with the default parameters', () => {
    store.load();
    expect(store.state()).toBe('loading');

    const req = http.expectOne((request) => request.url === BASE);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('unreadOnly')).toBe('false');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    expect(req.request.params.has('type')).toBe(false);
    req.flush(NOTIFICATION_PAGE_FIXTURE);

    expect(store.state()).toBe('ready');
    expect(store.items()).toHaveLength(3);
    expect(store.totalItems()).toBe(3);
  });

  it('sends the type and unread-only filters and returns to the first page when they change', () => {
    loadPage({ ...NOTIFICATION_PAGE_FIXTURE, totalItems: 50, totalPages: 3 });

    store.goToPage(2);
    const paged = http.expectOne((request) => request.url === BASE);
    expect(paged.request.params.get('page')).toBe('2');
    paged.flush({ ...NOTIFICATION_PAGE_FIXTURE, page: 2, totalItems: 50, totalPages: 3 });
    expect(store.page()).toBe(2);

    store.setTypeFilter('INCIDENT_REPORTED');
    const typed = http.expectOne((request) => request.url === BASE);
    expect(typed.request.params.get('type')).toBe('INCIDENT_REPORTED');
    expect(typed.request.params.get('page')).toBe('0');
    typed.flush(NOTIFICATION_PAGE_FIXTURE);

    store.setUnreadOnly(true);
    const unread = http.expectOne((request) => request.url === BASE);
    expect(unread.request.params.get('unreadOnly')).toBe('true');
    expect(unread.request.params.get('type')).toBe('INCIDENT_REPORTED');
    expect(unread.request.params.get('page')).toBe('0');
    unread.flush(NOTIFICATION_PAGE_FIXTURE);
    expect(store.typeFilter()).toBe('INCIDENT_REPORTED');
    expect(store.unreadOnly()).toBe(true);
  });

  it('marks one notification as read, updates its row and lowers the counter without reloading', () => {
    loadCount(3);
    loadPage();
    const unread = itemAt(0);

    store.markAsRead(unread);
    const patch = http.expectOne(`${BASE}/${unread.id}/read`);
    expect(patch.request.method).toBe('PATCH');
    patch.flush(null, { status: 204, statusText: 'No Content' });

    expect(store.unreadCount()).toBe(2);
    expect(itemAt(0).readAt).not.toBeNull();
    expect(itemAt(2).readAt).toBeNull();
    expect(store.isMarking(unread.id)).toBe(false);
  });

  it('ignores an already read notification and a repeated click while the request is pending', () => {
    loadPage();
    store.markAsRead(itemAt(1));
    http.expectNone(`${BASE}/${itemAt(1).id}/read`);

    const unread = itemAt(0);
    store.markAsRead(unread);
    store.markAsRead(unread);
    http.expectOne(`${BASE}/${unread.id}/read`).flush(null, { status: 204, statusText: '' });
  });

  it('marks all notifications as read and sets the counter to zero', () => {
    loadCount(3);
    loadPage();

    store.markAllAsRead();
    const req = http.expectOne(`${BASE}/read-all`);
    expect(req.request.method).toBe('POST');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(store.unreadCount()).toBe(0);
    expect(store.items().every((item) => item.readAt !== null)).toBe(true);
    expect(store.markingAll()).toBe(false);
  });

  it('reloads the list after marking all while the unread-only filter is active', () => {
    loadCount(3);
    store.setUnreadOnly(true);
    http.expectOne((request) => request.url === BASE).flush(NOTIFICATION_PAGE_FIXTURE);

    store.markAllAsRead();
    http.expectOne(`${BASE}/read-all`).flush(null, { status: 204, statusText: '' });
    http.expectOne((request) => request.url === BASE).flush(EMPTY_PAGE);

    expect(store.state()).toBe('ready');
    expect(store.items()).toEqual([]);
  });

  it('shows the problem detail when loading fails and retries on demand', () => {
    store.load();
    http
      .expectOne((request) => request.url === BASE)
      .flush({ detail: 'Sesión caducada.' }, { status: 401, statusText: 'Unauthorized' });

    expect(store.state()).toBe('error');
    expect(store.error()).toBe('Sesión caducada.');

    store.retry();
    http.expectOne((request) => request.url === BASE).flush(NOTIFICATION_PAGE_FIXTURE);
    expect(store.state()).toBe('ready');
    expect(store.error()).toBe('');
  });

  it('uses a general message when a failed load has no detail', () => {
    store.load();
    http
      .expectOne((request) => request.url === BASE)
      .flush(null, { status: 500, statusText: 'Server Error' });

    expect(store.state()).toBe('error');
    expect(store.error()).toContain('Ocurrió un error');
  });

  it('keeps the counter and reports a failed marking with a toast', () => {
    loadCount(3);
    loadPage();
    const item = itemAt(0);

    store.markAsRead(item);
    http
      .expectOne(`${BASE}/${item.id}/read`)
      .flush({ detail: 'La notificación no existe.' }, { status: 404, statusText: 'Not Found' });

    expect(store.unreadCount()).toBe(3);
    expect(itemAt(0).readAt).toBeNull();
    expect(store.isMarking(item.id)).toBe(false);
    expect(
      TestBed.inject(ToastService)
        .messages()
        .map((m) => m.text),
    ).toContain('La notificación no existe.');
  });

  it('refreshes the counter every 60 seconds only while the tab is visible', () => {
    vi.useFakeTimers();
    const owner = { onDestroy: vi.fn() } as unknown as DestroyRef;

    store.watchUnreadCount(owner);
    http.expectOne(COUNT_URL).flush({ count: 3 });
    expect(store.unreadCount()).toBe(3);

    setVisibility('hidden');
    vi.advanceTimersByTime(UNREAD_REFRESH_INTERVAL_MS);
    http.expectNone(COUNT_URL);

    setVisibility('visible');
    vi.advanceTimersByTime(UNREAD_REFRESH_INTERVAL_MS);
    http.expectOne(COUNT_URL).flush(UNREAD_NOTIFICATION_COUNT_FIXTURE);
    expect(store.unreadCount()).toBe(3);
  });

  it('stops refreshing when the owner that started the timer is destroyed', () => {
    vi.useFakeTimers();
    const onDestroy = vi.fn();
    const owner = { onDestroy } as unknown as DestroyRef;

    store.watchUnreadCount(owner);
    http.expectOne(COUNT_URL).flush({ count: 1 });

    const cleanup = onDestroy.mock.calls[0]?.[0] as () => void;
    cleanup();
    vi.advanceTimersByTime(UNREAD_REFRESH_INTERVAL_MS * 2);
    http.expectNone(COUNT_URL);
  });
});
