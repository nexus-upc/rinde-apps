import { TestBed } from '@angular/core/testing';
import { EntrancePreview } from './entrance-preview';

describe('EntrancePreview', () => {
  function create(): HTMLElement {
    const fixture = TestBed.createComponent(EntrancePreview);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EntrancePreview] }).compileComponents();
  });

  it('is hidden from assistive technology and inert', () => {
    const host = create();

    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(host.hasAttribute('inert')).toBe(true);
  });

  it('has nothing that can take focus or be pressed', () => {
    const host = create();

    expect(host.querySelector('a, button, input, select, textarea, [tabindex]')).toBeNull();
  });

  it('shows synthetic trips and the count of trips on the road', () => {
    const host = create();
    const text = host.textContent ?? '';

    expect(text).toContain('En ruta');
    expect(text).toContain('VJ-0012');
    expect(host.querySelectorAll('.preview__row')).toHaveLength(6);
    expect(host.querySelector('.preview__band strong')?.textContent?.trim()).toBe('3');
  });
});
