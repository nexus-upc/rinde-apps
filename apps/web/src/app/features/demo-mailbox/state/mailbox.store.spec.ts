import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MailboxStore } from './mailbox.store';
import { DemoMail } from '../models/mailbox.models';
const message: DemoMail = {
  id: 'mail-one',
  recipient: 'ana@example.invalid',
  recipientName: 'Ana',
  companyName: 'Empresa demo',
  purpose: 'EMAIL_VERIFICATION',
  subject: 'Verifica tu empresa',
  createdAt: '2026-10-27T10:00:00Z',
  expiresAt: '2026-10-29T10:00:00Z',
  readAt: null,
  state: 'ACTIVE',
};
describe('MailboxStore', () => {
  let store: MailboxStore;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MailboxStore, provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(MailboxStore);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('filters and paginates through the protected API', () => {
    store.filter('  ana@example.invalid  ', 'EMAIL_VERIFICATION');
    const request = http.expectOne((r) => r.url.endsWith('/demo-mailbox/messages'));
    expect(request.request.params.get('search')).toBe('ana@example.invalid');
    expect(request.request.params.get('purpose')).toBe('EMAIL_VERIFICATION');
    request.flush({ items: [message], page: 0, size: 20, total: 1 });
    expect(store.messages()).toEqual([message]);
    expect(store.pagination().total).toBe(1);
  });
  it('waits for one detail request and uses the read state confirmed by the server', () => {
    store.load();
    http
      .expectOne((r) => r.url.endsWith('/demo-mailbox/messages'))
      .flush({ items: [message], page: 0, size: 20, total: 1 });
    store.open('mail-one');
    store.open('mail-two');
    const request = http.expectOne((r) => r.url.endsWith('/demo-mailbox/messages/mail-one'));
    const read = { ...message, readAt: '2026-10-27T10:01:00Z' };
    request.flush({ message: read, actionPath: '/verify-email?tenant=one&token=opaque' });
    expect(store.messages()[0]?.readAt).toBe(read.readAt);
    expect(store.selected()).toBe('mail-one');
    store.close();
    expect(store.detail()).toBeNull();
    expect(store.selected()).toBeNull();
  });
  it('recovers from a failed read without creating a fake message', () => {
    store.load();
    http
      .expectOne((r) => r.url.endsWith('/demo-mailbox/messages'))
      .flush({ detail: 'No disponible' }, { status: 503, statusText: 'Unavailable' });
    expect(store.ready()).toBe(false);
    expect(store.messages()).toEqual([]);
    store.load();
    http
      .expectOne((r) => r.url.endsWith('/demo-mailbox/messages'))
      .flush({ items: [message], page: 0, size: 20, total: 1 });
    expect(store.ready()).toBe(true);
    expect(store.request.error()).toBeNull();
  });
  it('removes the selected action when a refresh confirms that its token was consumed', () => {
    store.load();
    http
      .expectOne((r) => r.url.endsWith('/demo-mailbox/messages'))
      .flush({ items: [message], page: 0, size: 20, total: 1 });
    store.open('mail-one');
    http
      .expectOne((r) => r.url.endsWith('/messages/mail-one'))
      .flush({ message, actionPath: '/verify-email?tenant=one&token=opaque' });
    store.load();
    http
      .expectOne((r) => r.url.endsWith('/demo-mailbox/messages'))
      .flush({ items: [{ ...message, state: 'USED' }], page: 0, size: 20, total: 1 });
    expect(store.detail()?.message.state).toBe('USED');
    expect(store.detail()?.actionPath).toBeNull();
  });
});
