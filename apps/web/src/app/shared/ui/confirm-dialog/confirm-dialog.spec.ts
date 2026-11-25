import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ConfirmDialog } from './confirm-dialog';

@Component({
  imports: [ConfirmDialog],
  template: `
    <button type="button" id="opener" (click)="open.set(true)">Abrir</button>
    <app-confirm-dialog
      [open]="open()"
      title="Cerrar liquidación"
      message="Esta acción no se puede deshacer."
      confirmLabel="Cerrar definitivamente"
      [pending]="pending()"
      [error]="error()"
      (confirmed)="confirmedCount = confirmedCount + 1"
      (cancelled)="open.set(false); cancelledCount = cancelledCount + 1"
    />
  `,
})
class ConfirmDialogHost {
  open = signal(false);
  pending = signal(false);
  error = signal<string | null>(null);
  confirmedCount = 0;
  cancelledCount = 0;
}

describe('ConfirmDialog', () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    };
  });

  it('opens, closes on Escape, and restores focus to the trigger element', async () => {
    const fixture = TestBed.createComponent(ConfirmDialogHost);
    fixture.detectChanges();

    const opener = fixture.nativeElement.querySelector('#opener') as HTMLButtonElement;
    document.body.appendChild(fixture.nativeElement);
    opener.focus();
    opener.click();
    fixture.detectChanges();
    await Promise.resolve();

    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(dialog.textContent).toContain('Cerrar liquidación');

    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.cancelledCount).toBe(1);
    expect(dialog.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(opener);

    fixture.nativeElement.remove();
  });

  it('traps Tab focus inside the dialog and emits confirmed on primary button click', async () => {
    const fixture = TestBed.createComponent(ConfirmDialogHost);
    document.body.appendChild(fixture.nativeElement);
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await Promise.resolve();

    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    const buttons = Array.from(dialog.querySelectorAll('button')) as HTMLButtonElement[];
    const first = buttons[0]!;
    const last = buttons[buttons.length - 1]!;

    last.focus();
    const tabForward = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    dialog.dispatchEvent(tabForward);
    expect(tabForward.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);

    first.focus();
    const tabBack = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    dialog.dispatchEvent(tabBack);
    expect(tabBack.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(last);

    last.click();
    expect(fixture.componentInstance.confirmedCount).toBe(1);

    fixture.nativeElement.remove();
  });
});
