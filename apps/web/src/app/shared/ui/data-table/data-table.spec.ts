import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DataTable } from './data-table';

@Component({
  imports: [DataTable],
  template: `<app-data-table ariaLabel="Tabla de gastos">
    <table class="arc-table">
      <thead>
        <tr>
          <th scope="col">Concepto</th>
          <th scope="col" class="arc-table__num">Monto</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td data-label="Concepto">Combustible</td>
          <td data-label="Monto" class="arc-table__num">S/ 180.50</td>
        </tr>
      </tbody>
    </table>
  </app-data-table>`,
})
class DataTableHost {}

describe('DataTable', () => {
  it('projects the table inside an accessible table wrapper', () => {
    const fixture = TestBed.createComponent(DataTableHost);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const region = root.querySelector('.arc-table-wrap');
    expect(region?.getAttribute('role')).toBe('region');
    expect(region?.getAttribute('aria-label')).toBe('Tabla de gastos');
    expect(root.querySelector('table.arc-table')).not.toBeNull();
    expect(root.querySelector('td.arc-table__num')?.textContent).toContain('S/ 180.50');
  });
});
