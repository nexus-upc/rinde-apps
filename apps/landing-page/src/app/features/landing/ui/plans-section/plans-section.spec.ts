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

  it('shows three plans, each with its name and unit limit', () => {
    const plans = render().querySelectorAll('.plan');

    expect(plans.length).toBe(3);
    const summary = Array.from(plans).map((plan) => ({
      name: plan.querySelector('h3')?.textContent?.trim(),
      limit: plan.querySelector('.plan__limit')?.textContent?.replace(/\s+/g, ' ').trim(),
    }));
    expect(summary).toEqual([
      { name: 'Plan Chasqui', limit: 'Hasta 5 unidades' },
      { name: 'Plan Qhapaq', limit: 'Hasta 15 unidades' },
      { name: 'Plan Apu', limit: 'Hasta 30 unidades' },
    ]);
  });

  it('does not show any price amount and links every plan to the demo form', () => {
    const host = render();
    const text = host.textContent ?? '';

    expect(text).not.toContain('S/');
    expect(text).not.toMatch(/[$€]|\d+[.,]\d{2}/);
    expect(text).toContain('Precio mensual por definir');
    host.querySelectorAll('.plan a').forEach((link) => {
      expect(link.getAttribute('href')).toBe('#demo');
    });
  });
});
