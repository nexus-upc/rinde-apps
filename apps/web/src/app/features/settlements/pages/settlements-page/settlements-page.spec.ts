import { TestBed } from '@angular/core/testing';
import { SettlementsPage } from './settlements-page';

describe('SettlementsPage', () => {
  it('shows the section title and the construction notice', () => {
    TestBed.configureTestingModule({ imports: [SettlementsPage] });
    const fixture = TestBed.createComponent(SettlementsPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Liquidaciones');
    expect(element.textContent).toContain('Pantalla en construcción (Sprint 3)');
  });
});
