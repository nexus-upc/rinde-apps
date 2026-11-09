import { TestBed } from '@angular/core/testing';
import { DriversPage } from './drivers-page';

describe('DriversPage', () => {
  it('shows the section title and the construction notice', () => {
    TestBed.configureTestingModule({ imports: [DriversPage] });
    const fixture = TestBed.createComponent(DriversPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Conductores');
    expect(element.textContent).toContain('Pantalla en construcción (Sprint 3)');
  });
});
