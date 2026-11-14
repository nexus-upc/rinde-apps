import { TestBed } from '@angular/core/testing';
import { PLANS_CONTENT } from '../../pages/landing-page/landing-content';
import { PlansSection } from './plans-section';

describe('PlansSection', () => {
  function render(): HTMLElement {
    const fixture = TestBed.createComponent(PlansSection);
    fixture.componentRef.setInput('content', PLANS_CONTENT);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows three plans in order, each with its name and unit limit', () => {
    const plans = Array.from(render().querySelectorAll('.plan'));

    expect(plans.length).toBe(3);
    expect(plans.map((plan) => plan.querySelector('h3')?.textContent?.trim())).toEqual([
      'Chasqui',
      'Qhapaq',
      'Apu',
    ]);
    expect(
      plans.map((plan) =>
        plan.querySelector('.plan__limit')?.textContent?.replace(/\s+/g, ' ').trim(),
      ),
    ).toEqual(['Hasta 5 unidades', 'Hasta 15 unidades', 'Hasta 30 unidades']);
  });

  it('draws one, two and three trucks, one per capacity level', () => {
    const plans = Array.from(render().querySelectorAll('.plan'));

    expect(plans.map((plan) => plan.querySelectorAll('.plan__trucks svg').length)).toEqual([
      1, 2, 3,
    ]);
  });

  it('shows no price amount and says the price is still to be defined', () => {
    const host = render();
    const text = host.textContent ?? '';

    expect(text).not.toContain('S/');
    expect(text).not.toMatch(/[$€]|\d+[.,]\d{2}/);
    expect(text).toContain('Por definir');
    expect(
      Array.from(host.querySelectorAll('.plan__price')).map((price) => price.textContent?.trim()),
    ).toEqual(['Por definir', 'Por definir', 'Por definir']);
  });

  it('links every plan call to the demo form', () => {
    const links = Array.from(render().querySelectorAll('.plan__cta'));

    expect(links.length).toBe(3);
    links.forEach((link) => {
      expect(link.getAttribute('href')).toBe('#demo');
    });
  });
});
