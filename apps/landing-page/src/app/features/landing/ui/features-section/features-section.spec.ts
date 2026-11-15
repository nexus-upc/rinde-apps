import { TestBed } from '@angular/core/testing';
import { FEATURES_CONTENT } from '../../pages/landing-page/landing-content';
import { FeaturesSection } from './features-section';

describe('FeaturesSection', () => {
  function render(): HTMLElement {
    const fixture = TestBed.createComponent(FeaturesSection);
    fixture.componentRef.setInput('content', FEATURES_CONTENT);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('is the funcionalidades section', () => {
    expect(render().querySelector('section')?.id).toBe('funcionalidades');
  });

  it('shows three showcase moments, each with a photo, a title and a description', () => {
    const moments = Array.from(render().querySelectorAll('.showcase > li'));

    expect(moments.length).toBe(3);
    moments.forEach((moment, index) => {
      const source = FEATURES_CONTENT.showcase[index];
      expect(moment.querySelector('img')?.getAttribute('alt')?.trim()).toBeTruthy();
      expect(moment.querySelector('h3')?.textContent?.trim()).toBe(source?.title);
      expect(moment.querySelector('p')?.textContent?.trim()).toBe(source?.description);
    });
  });

  it('lists the other features in the grid with an icon, a title and a description', () => {
    const items = Array.from(render().querySelectorAll('app-feature-grid li.feature'));

    expect(items.length).toBe(FEATURES_CONTENT.items.length);
    items.forEach((item, index) => {
      expect(item.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
      expect(item.querySelector('h3')?.textContent?.trim()).toBe(
        FEATURES_CONTENT.items[index]?.title,
      );
      expect(item.querySelector('p')?.textContent?.trim()).toBeTruthy();
    });
  });

  it('shows at least four features, each with icon, title and description (US02)', () => {
    const features = Array.from(render().querySelectorAll('.showcase > li, app-feature-grid li'));

    expect(features.length).toBeGreaterThanOrEqual(4);
    features.forEach((feature) => {
      expect(feature.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
      expect(feature.querySelector('h3')?.textContent?.trim()).toBeTruthy();
      expect(feature.querySelector('p')?.textContent?.trim()).toBeTruthy();
    });
  });
});
