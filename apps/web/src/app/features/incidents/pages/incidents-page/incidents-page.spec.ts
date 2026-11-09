import { TestBed } from '@angular/core/testing';
import { IncidentsPage } from './incidents-page';

describe('IncidentsPage', () => {
  it('shows the section title and the construction notice', () => {
    TestBed.configureTestingModule({ imports: [IncidentsPage] });
    const fixture = TestBed.createComponent(IncidentsPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Incidencias');
    expect(element.textContent).toContain('Pantalla en construcción (Sprint 3)');
  });
});
