import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ChartDatum } from './chart.models';
import { DonutChart } from './donut-chart';

@Component({
  imports: [DonutChart],
  template: `<app-donut-chart
    title="Viajes por estado"
    centerLabel="viajes"
    centerValue="10"
    labelHeader="Estado"
    valueHeader="Cantidad"
    [items]="items()"
  />`,
})
class DonutChartHost {
  items = signal<readonly ChartDatum[]>([
    { label: 'Finalizado', value: 4 },
    { label: 'Liquidado', value: 6 },
  ]);
}

describe('DonutChart', () => {
  it('renders SVG donut segments, legend and accessible equivalent table', () => {
    const fixture = TestBed.createComponent(DonutChartHost);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const svg = root.querySelector('svg.donut-chart__svg');
    const segments = root.querySelectorAll('.donut-chart__segment');
    const table = root.querySelector('table.visually-hidden');

    expect(svg).not.toBeNull();
    expect(segments.length).toBe(2);
    expect(root.textContent).toContain('40%');
    expect(root.textContent).toContain('60%');
    expect(table?.querySelectorAll('tbody tr').length).toBe(2);
    expect(table?.textContent).toContain('Liquidado');
  });

  it('renders an empty state when there is no data', () => {
    const fixture = TestBed.createComponent(DonutChartHost);
    fixture.componentInstance.items.set([]);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('svg.donut-chart__svg')).toBeNull();
    expect(root.querySelector('app-state-panel')).not.toBeNull();
    expect(root.textContent).toContain('Sin datos para mostrar');
  });
});
