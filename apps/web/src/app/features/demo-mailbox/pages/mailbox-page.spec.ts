import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DemoModeService } from '@core/config/demo-mode.service';
import { MailboxPage } from './mailbox-page';
describe('MailboxPage disabled mode', () => {
  it('does not request messages when the environment has no enabled demonstration mailbox', () => {
    TestBed.configureTestingModule({
      imports: [MailboxPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: DemoModeService,
          useValue: {
            ready: signal(true),
            mailboxEnabled: signal(false),
            request: { pending: signal(false), error: signal(null) },
            load: vi.fn(),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(MailboxPage);
    fixture.detectChanges();
    TestBed.tick();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Buzón no habilitado');
    TestBed.inject(HttpTestingController).expectNone((r) =>
      r.url.includes('/demo-mailbox/messages'),
    );
    TestBed.inject(HttpTestingController).verify();
  });
});
