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

  it('mounts the demo request form inside the demo section', () => {
    const fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('section#demo app-demo-request-form form')).not.toBeNull();
  });

  it('renders every section with its anchor id', () => {
    const fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    for (const id of ['inicio', 'funcionalidades', 'conductores', 'planes', 'preguntas', 'demo']) {
      expect(host.querySelector(`section#${id}`), id).not.toBeNull();
    }
    expect(host.querySelectorAll('h1').length).toBe(1);
    expect(host.querySelector('#demo-title')?.textContent?.trim()).toBe(
      'Solicite una demostración',
    );
  });

  it('links the header and the footer to the same sections', () => {
    const fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const hrefs = (selector: string) =>
      Array.from(host.querySelectorAll(`${selector} a`)).map((a) => a.getAttribute('href'));

    expect(hrefs('footer')).toEqual(['#funcionalidades', '#conductores', '#planes', '#preguntas']);
    expect(hrefs('app-site-header nav')).toContain('#demo');
  });
});
