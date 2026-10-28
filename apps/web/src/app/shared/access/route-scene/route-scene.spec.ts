import { TestBed } from '@angular/core/testing';
import { RouteScene } from './route-scene';

describe('RouteScene', () => {
  function create(): HTMLElement {
    const fixture = TestBed.createComponent(RouteScene);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RouteScene] }).compileComponents();
  });

  it('is hidden from assistive technology and inert', () => {
    const host = create();

    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(host.hasAttribute('inert')).toBe(true);
    expect(host.querySelector('button, a, input, select, textarea, [tabindex]')).toBeNull();
  });

  it('shows the three stops of the sample trip', () => {
    const host = create();
    const cities = Array.from(host.querySelectorAll('.route-scene__city')).map(
      (c) => c.textContent,
    );

    expect(cities).toEqual(['Lima', 'Ica', 'Arequipa']);
    expect(host.querySelector('.route-scene__code')?.textContent).toBe('TRP-000124');
  });
});
