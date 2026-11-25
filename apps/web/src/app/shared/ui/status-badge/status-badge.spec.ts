import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StatusBadge, StatusBadgeTone } from './status-badge';

@Component({
  imports: [StatusBadge],
  template: `<app-status-badge [tone]="tone()" [label]="label()" />`,
})
class BadgeHost {
  tone = signal<StatusBadgeTone>('neutral');
  label = signal('Programado');
}

describe('StatusBadge', () => {
  it('renders required text and applies the corresponding tone class', () => {
    const fixture = TestBed.createComponent(BadgeHost);
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.status-badge') as HTMLElement;
    expect(badge.textContent?.trim()).toBe('Programado');
    expect(badge.classList.contains('status-badge--neutral')).toBe(true);

    for (const tone of ['success', 'wait', 'danger'] as const) {
      fixture.componentInstance.tone.set(tone);
      fixture.componentInstance.label.set(`Estado ${tone}`);
      fixture.detectChanges();
      expect(badge.classList.contains(`status-badge--${tone}`)).toBe(true);
      expect(badge.textContent?.trim()).toBe(`Estado ${tone}`);
    }
  });
});
