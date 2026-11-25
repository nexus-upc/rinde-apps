import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { StatePanel } from '../state-panel/state-panel';
import { ChartDatum, resolveChartToken } from './chart.models';

interface DonutSlice {
  readonly label: string;
  readonly formattedValue: string;
  readonly percentText: string;
  readonly dashArray: string;
  readonly dashOffset: number;
  readonly color: string;
}

const RADIUS = 56;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Gráfico de dona en SVG propio con leyenda, tabla accesible y estado vacío. */
@Component({
  selector: 'app-donut-chart',
  imports: [StatePanel],
  template: `<figure class="donut-chart">
    @if (title()) {
      <figcaption class="donut-chart__title">{{ title() }}</figcaption>
    }
    @if (!hasData()) {
      <app-state-panel [title]="emptyTitle()" [message]="emptyMessage()" />
    } @else {
      <div class="donut-chart__body">
        <svg class="donut-chart__svg" viewBox="0 0 160 160" aria-hidden="true">
          <circle cx="80" cy="80" [attr.r]="radius" class="donut-chart__track" />
          @for (slice of slices(); track slice.label) {
            <circle
              cx="80"
              cy="80"
              [attr.r]="radius"
              class="donut-chart__segment"
              [attr.stroke]="slice.color"
              [attr.stroke-dasharray]="slice.dashArray"
              [attr.stroke-dashoffset]="slice.dashOffset"
              transform="rotate(-90 80 80)"
            />
          }
          @if (centerValue()) {
            <text x="80" y="78" text-anchor="middle" class="donut-chart__center-value">
              {{ centerValue() }}
            </text>
          }
          @if (centerLabel()) {
            <text x="80" y="96" text-anchor="middle" class="donut-chart__center-label">
              {{ centerLabel() }}
            </text>
          }
        </svg>

        <ul class="donut-chart__legend">
          @for (slice of slices(); track slice.label) {
            <li class="donut-chart__legend-item">
              <span
                class="donut-chart__swatch"
                [style.background]="slice.color"
                aria-hidden="true"
              ></span>
              <span class="donut-chart__legend-label">{{ slice.label }}</span>
              <span class="donut-chart__legend-value">
                {{ slice.formattedValue }} ({{ slice.percentText }})
              </span>
            </li>
          }
        </ul>
      </div>

      <table class="visually-hidden">
        @if (title()) {
          <caption>{{ title() }}</caption>
        }
        <thead>
          <tr>
            <th scope="col">{{ labelHeader() }}</th>
            <th scope="col">{{ valueHeader() }}</th>
            <th scope="col">Porcentaje</th>
          </tr>
        </thead>
        <tbody>
          @for (slice of slices(); track slice.label) {
            <tr>
              <td>{{ slice.label }}</td>
              <td>{{ slice.formattedValue }}</td>
              <td>{{ slice.percentText }}</td>
            </tr>
          }
        </tbody>
      </table>
    }
  </figure>`,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    .donut-chart {
      margin: 0;
      display: grid;
      gap: 16px;
      min-width: 0;
    }

    .donut-chart__title {
      color: var(--arc-ink);
      font-size: 16px;
      font-weight: 600;
      line-height: 24px;
    }

    .donut-chart__body {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 20px;
      min-width: 0;
    }

    .donut-chart__svg {
      flex: none;
      width: 160px;
      max-width: 100%;
      height: 160px;
    }

    .donut-chart__track,
    .donut-chart__segment {
      fill: none;
      stroke-width: 22;
    }

    .donut-chart__track {
      stroke: var(--arc-surface);
    }

    .donut-chart__center-value {
      fill: var(--arc-ink);
      font-family: var(--arc-font-sans);
      font-size: 20px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    .donut-chart__center-label {
      fill: var(--arc-muted);
      font-family: var(--arc-font-sans);
      font-size: 12px;
    }

    .donut-chart__legend {
      display: grid;
      flex: 1 1 180px;
      gap: 8px;
      min-width: 0;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .donut-chart__legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      font-size: 13px;
      line-height: 18px;
    }

    .donut-chart__swatch {
      flex: none;
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .donut-chart__legend-label {
      flex: 1;
      color: var(--arc-muted);
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .donut-chart__legend-value {
      flex: none;
      color: var(--arc-ink);
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DonutChart {
  readonly title = input('');
  readonly items = input.required<readonly ChartDatum[]>();
  readonly centerLabel = input('');
  readonly centerValue = input('');
  readonly labelHeader = input('Concepto');
  readonly valueHeader = input('Valor');
  readonly emptyTitle = input('Sin datos para mostrar');
  readonly emptyMessage = input('No hay registros disponibles en el periodo elegido.');

  protected readonly radius = RADIUS;

  protected readonly hasData = computed(() =>
    this.items().some((item) => Number.isFinite(item.value) && item.value > 0),
  );

  protected readonly slices = computed<readonly DonutSlice[]>(() => {
    const data = this.items();
    const total = data.reduce((sum, item) => sum + Math.max(0, item.value), 0);
    if (total <= 0) return [];

    let offset = 0;
    return data.map((item, index) => {
      const safeValue = Math.max(0, item.value);
      const length = (safeValue / total) * CIRCUMFERENCE;
      const slice: DonutSlice = {
        label: item.label,
        formattedValue: item.formattedValue ?? String(safeValue),
        percentText: `${Math.round((safeValue / total) * 100)}%`,
        dashArray: `${length} ${CIRCUMFERENCE - length}`,
        dashOffset: -offset,
        color: resolveChartToken(item.tone, index),
      };
      offset += length;
      return slice;
    });
  });
}
