import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NotificationBell } from './notification-bell';

describe('NotificationBell', () => {
  let fixture: ComponentFixture<NotificationBell>;
  const link = () => fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
  const badge = () =>
    fixture.nativeElement.querySelector('.notification-bell__count') as HTMLElement | null;

  function render(unreadCount: number): void {
    TestBed.configureTestingModule({ imports: [NotificationBell], providers: [provideRouter([])] });
    fixture = TestBed.createComponent(NotificationBell);
    fixture.componentRef.setInput('unreadCount', unreadCount);
    fixture.detectChanges();
  }

  it('links to the notification center and hides the badge when nothing is unread', () => {
    render(0);

    expect(link().getAttribute('href')).toBe('/notifications');
    expect(link().getAttribute('aria-label')).toBe('Centro de notificaciones');
    expect(badge()).toBeNull();
  });

  it('shows the unread count in the badge and in the accessible name', () => {
    render(3);

    expect(badge()?.textContent?.trim()).toBe('3');
    expect(link().getAttribute('aria-label')).toBe('Centro de notificaciones, 3 sin leer');
  });

  it('shows 99 as is and caps larger counts at 99+', () => {
    render(99);
    expect(badge()?.textContent?.trim()).toBe('99');

    fixture.componentRef.setInput('unreadCount', 120);
    fixture.detectChanges();
    expect(badge()?.textContent?.trim()).toBe('99+');
    expect(link().getAttribute('aria-label')).toBe('Centro de notificaciones, 120 sin leer');
  });
});
