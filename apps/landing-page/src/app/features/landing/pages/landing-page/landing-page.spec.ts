import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LandingPage } from './landing-page';

describe('LandingPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  function render(): HTMLElement {
    const fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('mounts the demo request form inside the demo section', () => {
    expect(render().querySelector('section#demo app-demo-request-form form')).not.toBeNull();
  });

  it('renders every section with its anchor id', () => {
    const host = render();

    for (const id of [
      'inicio',
      'conozca',
      'funcionalidades',
      'conductores',
      'empezar',
      'planes',
      'demo',
      'preguntas',
    ]) {
      expect(host.querySelector(`section#${id}`), id).not.toBeNull();
    }
  });

  it('has a single h1 and the demo heading', () => {
    const host = render();

    expect(host.querySelectorAll('h1').length).toBe(1);
    expect(host.querySelector('#demo-title')?.textContent?.trim()).toBe(
      'Solicite una demostración',
    );
  });

  it('links the header navigation to the demo form', () => {
    const hrefs = Array.from(render().querySelectorAll('app-site-header nav a')).map((link) =>
      link.getAttribute('href'),
    );

    expect(hrefs).toContain('#demo');
  });
});
