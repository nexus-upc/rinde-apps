import { TestBed } from '@angular/core/testing';
import { FleetPage } from './fleet-page';

describe('FleetPage', () => {
  it('shows the section title and the construction notice', () => {
    TestBed.configureTestingModule({ imports: [FleetPage] });
    const fixture = TestBed.createComponent(FleetPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Flota');
    expect(element.textContent).toContain('Pantalla en construcción (Sprint 3)');
  });
});
