import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NotificationBell } from '../../ui/notification-bell/notification-bell';
import { NotificationsPage } from './notifications-page';

describe('Notifications shell', () => {
  it('renders the notifications page header and empty state', () => {
    TestBed.configureTestingModule({ imports: [NotificationsPage] });
    const fixture = TestBed.createComponent(NotificationsPage);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('h1')?.textContent).toContain('Notificaciones');
    expect(root.textContent).toContain('Sin notificaciones');
  });

  it('renders the notification bell link pointing to /notifications', () => {
    TestBed.configureTestingModule({
      imports: [NotificationBell],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(NotificationBell);
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement | null;
    expect(link?.getAttribute('href')).toBe('/notifications');
    expect(link?.getAttribute('aria-label')).toBe('Centro de notificaciones');
  });
});
