import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MailDetail } from './mail-detail';
import { DemoMailDetail } from '../models/mailbox.models';
const data: DemoMailDetail = {
  message: {
    id: 'mail-one',
    recipient: 'driver@example.invalid',
    recipientName: 'Conductor de prueba',
    companyName: 'Empresa demo',
    purpose: 'INVITATION',
    subject: 'Tu invitación',
    createdAt: '2026-10-27T10:00:00Z',
    expiresAt: '2026-10-29T10:00:00Z',
    readAt: null,
    state: 'ACTIVE',
  },
  actionPath: '/accept-invitation?token=opaque-demo-token',
};
describe('MailDetail', () => {
  let fixture: ComponentFixture<MailDetail>;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [MailDetail] });
    fixture = TestBed.createComponent(MailDetail);
  });
  it('opens the recipient flow without sharing the operator tab or exposing the token as text', () => {
    fixture.componentRef.setInput('mail', data);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const action = root.querySelector<HTMLAnchorElement>('a');
    expect(action?.getAttribute('href')).toBe(data.actionPath);
    expect(action?.target).toBe('_blank');
    expect(action?.rel).toContain('noopener');
    expect(action?.getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(root.textContent).not.toContain('opaque-demo-token');
  });
  it('does not offer an expired or used link even if a response mistakenly contains one', () => {
    fixture.componentRef.setInput('mail', { ...data, message: { ...data.message, state: 'USED' } });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('a')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('no se puede reutilizar');
    fixture.componentRef.setInput('mail', {
      ...data,
      message: { ...data.message, state: 'EXPIRED' },
    });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('a')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('venció');
  });
  it('rejects an external or unexpected action path', () => {
    fixture.componentRef.setInput('mail', {
      ...data,
      actionPath: 'https://outside.example.invalid/reset-password?token=opaque',
    });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('a')).toBeNull();
    fixture.componentRef.setInput('mail', {
      ...data,
      actionPath: '/platform/companies?token=opaque',
    });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('a')).toBeNull();
  });
});
