import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import {
  NOTIFICATION_EMPTY_PAGE_FIXTURE,
  NOTIFICATION_PAGE_FIXTURE,
} from '../../fixtures/notification.fixtures';
import { NotificationCenterStore } from '../../state/notification-center.store';
import { NotificationsPage } from './notifications-page';

const BASE = `${environment.apiBaseUrl}/api/v1/notifications`;
const EXPENSE_ID = 'a1b2c3d4-1111-4222-8333-444455556666';

describe('NotificationsPage', () => {
  let fixture: ComponentFixture<NotificationsPage>;
  let http: HttpTestingController;
  const root = () => fixture.nativeElement as HTMLElement;
  const rows = () => root().querySelectorAll('.notif-row');
  const row = (index: number): HTMLElement => {
    const element = rows().item(index);
    if (!element) throw new Error(`No hay aviso en la posición ${index}.`);
    return element as HTMLElement;
  };
  const listRequest = () => http.expectOne((request) => request.url === BASE);
  const button = (label: string) =>
    Array.from(root().querySelectorAll('button')).find((item) => item.textContent?.includes(label));

  function create(): void {
    TestBed.configureTestingModule({
      imports: [NotificationsPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(NotificationsPage);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }

  afterEach(() => http.verify());

  it('shows the header and the loading state until the first page arrives', () => {
    create();

    expect(root().querySelector('h1')?.textContent).toContain('Notificaciones');
    expect(root().textContent).toContain('Cargando notificaciones');

    listRequest().flush(NOTIFICATION_PAGE_FIXTURE);
    fixture.detectChanges();
    expect(root().textContent).not.toContain('Cargando notificaciones');
  });

  it('shows the empty state of the notification center', () => {
    create();
    listRequest().flush(NOTIFICATION_EMPTY_PAGE_FIXTURE);
    fixture.detectChanges();

    expect(root().textContent).toContain('Sin notificaciones');
    expect(root().textContent).toContain(
      'Cuando existan avisos operativos aparecerán en esta bandeja.',
    );
  });

  it('shows the unread empty state when the unread-only filter has no items', () => {
    create();
    listRequest().flush(NOTIFICATION_EMPTY_PAGE_FIXTURE);
    fixture.detectChanges();

    const toggle = root().querySelector('.toggle input') as HTMLInputElement;
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));
    listRequest().flush(NOTIFICATION_EMPTY_PAGE_FIXTURE);
    fixture.detectChanges();

    expect(root().textContent).toContain('No tienes avisos sin leer');
  });

  it('shows the error state with a retry action', () => {
    create();
    listRequest().flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(root().querySelector('[role="alert"]')?.textContent).toContain(
      'No pudimos cargar tus avisos',
    );

    button('Reintentar')?.click();
    listRequest().flush(NOTIFICATION_PAGE_FIXTURE);
    fixture.detectChanges();

    expect(rows()).toHaveLength(3);
  });

  it('renders each notification with its type label and read state, never the enum', () => {
    create();
    listRequest().flush(NOTIFICATION_PAGE_FIXTURE);
    fixture.detectChanges();

    expect(rows()).toHaveLength(3);
    expect(row(0).textContent).toContain('Gasto pendiente de revisión');
    expect(row(0).textContent).toContain('Gastos por revisar');
    expect(row(0).textContent).toContain('Sin leer');
    expect(row(0).textContent).toContain('Revisar gastos del viaje');
    expect(row(1).classList).toContain('is-read');
    expect(row(1).textContent).toContain('Viajes por liquidar');
    expect(row(1).textContent).toContain('Leída');
    expect(root().textContent).not.toMatch(
      /EXPENSE_PENDING_REVIEW|MAINTENANCE_DUE|INCIDENT_REPORTED|SETTLEMENT_READY/,
    );
  });

  it('marks an unread notification as read and navigates to its internal link', () => {
    create();
    listRequest().flush(NOTIFICATION_PAGE_FIXTURE);
    fixture.detectChanges();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    button('Revisar gastos del viaje')?.click();
    const patch = http.expectOne(`${BASE}/${EXPENSE_ID}/read`);
    expect(patch.request.method).toBe('PATCH');
    patch.flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();

    expect(navigate).toHaveBeenCalledWith('/expenses?tripId=87460614-42ea-4cd5-9de1-8f38d9496434');
    expect(row(0).textContent).toContain('Leída');
  });

  it('navigates without a request when the notification is already read', () => {
    create();
    listRequest().flush(NOTIFICATION_PAGE_FIXTURE);
    fixture.detectChanges();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    button('Ver viaje')?.click();

    expect(navigate).toHaveBeenCalledWith('/trips/7b0e4f52-1c9a-4f3e-8d21-5a6c9e0b3d44');
    http.expectNone((request) => request.method === 'PATCH' && request.url.startsWith(BASE));
  });

  it('filters by type with the chips and sends the type parameter', () => {
    create();
    listRequest().flush(NOTIFICATION_PAGE_FIXTURE);
    fixture.detectChanges();

    button('Incidencias')?.click();
    const filtered = listRequest();
    expect(filtered.request.params.get('type')).toBe('INCIDENT_REPORTED');
    expect(filtered.request.params.get('page')).toBe('0');
    filtered.flush(NOTIFICATION_PAGE_FIXTURE);
    fixture.detectChanges();

    expect(button('Incidencias')?.getAttribute('aria-pressed')).toBe('true');
  });

  it('marks all notifications as read from the header when some are unread', () => {
    create();
    const store = TestBed.inject(NotificationCenterStore);
    store.refreshUnreadCount();
    http.expectOne(`${BASE}/unread-count`).flush({ count: 2 });
    listRequest().flush(NOTIFICATION_PAGE_FIXTURE);
    fixture.detectChanges();

    const markAll = button('Marcar todas como leídas') as HTMLButtonElement;
    expect(markAll.disabled).toBe(false);
    markAll.click();
    http.expectOne(`${BASE}/read-all`).flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();

    expect((button('Marcar todas como leídas') as HTMLButtonElement).disabled).toBe(true);
    expect(root().textContent).not.toContain('Sin leer');
    expect(row(0).textContent).toContain('Leída');
  });

  it('paginates with the shared pagination control', () => {
    create();
    listRequest().flush({ ...NOTIFICATION_PAGE_FIXTURE, totalItems: 25, totalPages: 2 });
    fixture.detectChanges();

    root().querySelector<HTMLButtonElement>('[aria-label="Página siguiente"]')?.click();
    const next = listRequest();
    expect(next.request.params.get('page')).toBe('1');
    next.flush({ ...NOTIFICATION_PAGE_FIXTURE, page: 1, totalItems: 25, totalPages: 2 });
    fixture.detectChanges();

    expect(root().textContent).toContain('Página 2 de 2');
  });
});
