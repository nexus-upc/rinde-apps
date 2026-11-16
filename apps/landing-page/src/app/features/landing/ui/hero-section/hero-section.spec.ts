import { TestBed } from '@angular/core/testing';
import { HERO_CONTENT } from '../../pages/landing-page/landing-content';
import { HeroSection } from './hero-section';

describe('HeroSection', () => {
  function render(): HTMLElement {
    const fixture = TestBed.createComponent(HeroSection);
    fixture.componentRef.setInput('content', HERO_CONTENT);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('is the inicio section and shows the value proposition as its only heading', () => {
    const host = render();

    expect(host.querySelector('section')?.id).toBe('inicio');
    expect(host.querySelectorAll('h1').length).toBe(1);
    expect(host.querySelector('h1')?.textContent?.trim()).toBe(HERO_CONTENT.title);
  });

  it('points the first link to the demo form and offers a link to the plans', () => {
    const host = render();
    const cta = host.querySelector('a');

    expect(cta?.getAttribute('href')).toBe('#demo');
    expect(cta?.textContent?.trim()).toBe('Solicitar demostración');
    expect(host.querySelector('a[href="#planes"]')).not.toBeNull();
  });

  it('gives the driver phone an accessible name and shows the offline badge', () => {
    const host = render();
    const phone = host.querySelector('[role="img"]');

    expect(phone?.getAttribute('aria-label')?.trim()).toBeTruthy();
    expect(host.querySelector('.badge__title')?.textContent?.trim()).toBe('Registre sin señal');
  });
});
