import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ChartDatum } from './chart.models';
import { HorizontalBarChart } from './horizontal-bar-chart';

@Component({
  imports: [HorizontalBarChart],
  template: `<app-horizontal-bar-chart
    title="Gastos por categoría"
    labelHeader="Categoría"
    valueHeader="Monto"
    [items]="items()"
  />`,
})
class BarChartHost {
  items = signal<readonly ChartDatum[]>([
    { label: 'Combustible', value: 2450, formattedValue: 'S/ 2,450.00' },
    { label: 'Peaje', value: 420.5, formattedValue: 'S/ 420.50' },
  ]);
}

describe('HorizontalBarChart', () => {
  it('renders SVG bars and an accessible equivalent table', () => {
    const fixture = TestBed.createComponent(BarChartHost);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const svg = root.querySelector('svg.bar-chart__svg');
    const table = root.querySelector('table.visually-hidden');

    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(table?.querySelector('caption')?.textContent).toContain('Gastos por categoría');
    expect(table?.querySelectorAll('tbody tr').length).toBe(2);
    expect(table?.textContent).toContain('Combustible');
    expect(table?.textContent).toContain('S/ 2,450.00');
  });

  it('renders an empty state when there are no positive values', () => {
    const fixture = TestBed.createComponent(BarChartHost);
    fixture.componentInstance.items.set([{ label: 'Combustible', value: 0 }]);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('svg.bar-chart__svg')).toBeNull();
    expect(root.querySelector('app-state-panel')).not.toBeNull();
    expect(root.textContent).toContain('Sin datos para mostrar');
  });
});
