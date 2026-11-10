import { TestBed } from '@angular/core/testing';
import { HeroContent } from '../../models/landing-content.models';
import { HeroSection } from './hero-section';

const CONTENT: HeroContent = {
  eyebrow: 'Etiqueta',
  title: 'Propuesta de valor',
  subtitle: 'Subtítulo',
  cta: { label: 'Solicitar demostración', href: '#demo' },
  highlights: ['Viajes'],
};

describe('HeroSection', () => {
  it('shows the value proposition as the page heading and points the call to action to #demo', () => {
    const fixture = TestBed.createComponent(HeroSection);
    fixture.componentRef.setInput('content', CONTENT);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const cta = host.querySelector('a');

    expect(host.querySelector('section')?.id).toBe('inicio');
    expect(host.querySelector('h1')?.textContent?.trim()).toBe('Propuesta de valor');
    expect(cta?.getAttribute('href')).toBe('#demo');
    expect(cta?.textContent?.trim()).toBe('Solicitar demostración');
  });
});
