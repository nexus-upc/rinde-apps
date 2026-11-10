import { TestBed } from '@angular/core/testing';
import { FeaturesContent } from '../../models/landing-content.models';
import { FeaturesSection } from './features-section';

const CONTENT: FeaturesContent = {
  intro: { eyebrow: 'Operaciones', title: 'Título', lead: 'Introducción' },
  items: ['a', 'b', 'c', 'd'].map((id) => ({
    id,
    title: `Título ${id}`,
    description: `Descripción ${id}`,
    iconPaths: ['M0 0h24'],
  })),
};

describe('FeaturesSection', () => {
  it('shows every feature with icon, title and description', () => {
    const fixture = TestBed.createComponent(FeaturesSection);
    fixture.componentRef.setInput('content', CONTENT);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const features = host.querySelectorAll('.feature');

    expect(host.querySelector('section')?.id).toBe('funcionalidades');
    expect(features.length).toBeGreaterThanOrEqual(4);
    features.forEach((feature) => {
      expect(feature.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
      expect(feature.querySelector('h3')?.textContent?.trim()).toBeTruthy();
      expect(feature.querySelector('p')?.textContent?.trim()).toBeTruthy();
    });
  });
});
