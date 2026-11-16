import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiButton } from './ui-button';

@Component({
  imports: [UiButton],
  template: `<form>
      <button uiButton [loading]="loading()" (click)="clicks = clicks + 1">Guardar</button>
    </form>
    <a uiButton href="/destination" [disabled]="loading()">Ir</a>`,
})
class ButtonHost {
  loading = signal(false);
  clicks = 0;
}

describe('UiButton accessibility contract', () => {
  it('does not submit a surrounding form unless the caller requests submit', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('button') as HTMLButtonElement).type).toBe(
      'button',
    );
  });
  it('disables interaction while loading and restores it afterward', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(button.disabled).toBe(true);
    expect(fixture.componentInstance.clicks).toBe(0);
    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();
    button.click();
    expect(fixture.componentInstance.clicks).toBe(1);
  });
  it('prevents navigation on a disabled anchor and exposes its state to assistive technology', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    const anchor = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    anchor.dispatchEvent(click);
    expect(anchor.getAttribute('aria-disabled')).toBe('true');
    expect(click.defaultPrevented).toBe(true);
  });
});
