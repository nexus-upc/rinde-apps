import { TestBed } from '@angular/core/testing';
import { NavLink } from '../../models/landing-content.models';
import { SiteHeader } from './site-header';

const LINKS: readonly NavLink[] = [
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Planes', href: '#planes' },
];

describe('SiteHeader', () => {
  function setup() {
    const fixture = TestBed.createComponent(SiteHeader);
    fixture.componentRef.setInput('links', LINKS);
    fixture.componentRef.setInput('cta', { label: 'Solicitar demostración', href: '#demo' });
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const toggle = host.querySelector<HTMLButtonElement>('.toggle');
    const menu = host.querySelector<HTMLElement>('#site-menu');
    return { fixture, host, toggle, menu };
  }

  it('renders the section links and the demo call to action', () => {
    const { host } = setup();
    const hrefs = Array.from(host.querySelectorAll('nav a')).map((a) => a.getAttribute('href'));

    expect(hrefs).toEqual(['#funcionalidades', '#planes', '#demo']);
  });

  it('opens and closes the menu and keeps aria-expanded in sync', () => {
    const { fixture, toggle, menu } = setup();

    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    expect(toggle?.getAttribute('aria-controls')).toBe('site-menu');
    expect(toggle?.getAttribute('aria-label')).toBeTruthy();
    expect(menu?.classList.contains('is-open')).toBe(false);

    toggle?.click();
    fixture.detectChanges();
    expect(toggle?.getAttribute('aria-expanded')).toBe('true');
    expect(menu?.classList.contains('is-open')).toBe(true);

    toggle?.click();
    fixture.detectChanges();
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    expect(menu?.classList.contains('is-open')).toBe(false);
  });

  it('closes the menu when an option is chosen', () => {
    const { fixture, host, toggle, menu } = setup();

    toggle?.click();
    fixture.detectChanges();
    host.querySelector<HTMLAnchorElement>('.menu__link')?.click();
    fixture.detectChanges();

    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    expect(menu?.classList.contains('is-open')).toBe(false);
  });
});
