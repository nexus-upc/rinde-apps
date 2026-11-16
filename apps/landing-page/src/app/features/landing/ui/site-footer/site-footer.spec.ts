import { TestBed } from '@angular/core/testing';
import { FOOTER_CONTENT } from '../../pages/landing-page/landing-content';
import { SiteFooter } from './site-footer';

describe('SiteFooter', () => {
  function render(): HTMLElement {
    const fixture = TestBed.createComponent(SiteFooter);
    fixture.componentRef.setInput('content', FOOTER_CONTENT);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the Producto and Ayuda columns', () => {
    const titles = Array.from(render().querySelectorAll('.col__title')).map((title) =>
      title.textContent?.trim(),
    );

    expect(titles).toEqual(['Producto', 'Ayuda']);
  });

  it('links the footer navigation to the sections of the page', () => {
    const hrefs = Array.from(render().querySelectorAll('nav a')).map((link) =>
      link.getAttribute('href'),
    );

    expect(hrefs).toEqual([
      '#funcionalidades',
      '#conductores',
      '#planes',
      '#empezar',
      '#preguntas',
      '#demo',
    ]);
  });

  it('shows the current year and the RINDE signature', () => {
    const text = render().textContent ?? '';

    expect(text).toContain(String(new Date().getFullYear()));
    expect(text).toContain('RINDE by NEXUS');
  });

  it('gives the landscape illustration a text alternative', () => {
    expect(render().querySelector('.art__image')?.getAttribute('alt')?.trim()).toBeTruthy();
  });
});
