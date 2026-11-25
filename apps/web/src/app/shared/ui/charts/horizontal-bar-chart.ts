import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { StatePanel } from '../state-panel/state-panel';
import { ChartDatum, resolveChartToken } from './chart.models';

interface BarRow {
  readonly label: string;
  readonly displayLabel: string;
  readonly formattedValue: string;
  readonly value: number;
  readonly widthPercent: number;
  readonly color: string;
  readonly y: number;
}

const ROW_HEIGHT = 36;
const BAR_X = 118;
const BAR_MAX_WIDTH = 166;
const VALUE_X = 352;
const VIEWBOX_WIDTH = 360;

/** Gráfico de barras horizontales en SVG propio con tabla accesible y estado vacío. */
@Component({
  selector: 'app-horizontal-bar-chart',
  imports: [StatePanel],
  template: `<figure class="bar-chart">
    @if (title()) {
      <figcaption class="bar-chart__title">{{ title() }}</figcaption>
    }
    @if (!hasData()) {
      <app-state-panel [title]="emptyTitle()" [message]="emptyMessage()" />
    } @else {
      <svg
        class="bar-chart__svg"
        [attr.viewBox]="'0 0 ' + viewBoxWidth + ' ' + svgHeight()"
        aria-hidden="true"
      >
        @for (row of rows(); track row.label) {
          <g [attr.transform]="'translate(0, ' + row.y + ')'">
            <text x="0" y="18" class="bar-chart__label">{{ row.displayLabel }}</text>
            <rect
              [attr.x]="barX"
              y="6"
              [attr.width]="barMaxWidth"
              height="16"
              rx="8"
              class="bar-chart__track"
            />
            <rect
              [attr.x]="barX"
              y="6"
              [attr.width]="row.widthPercent"
              height="16"
              rx="8"
              [attr.fill]="row.color"
            />
            <text [attr.x]="valueX" y="18" text-anchor="end" class="bar-chart__value">
              {{ row.formattedValue }}
            </text>
          </g>
        }
      </svg>

      <table class="visually-hidden">
        @if (title()) {
          <caption>{{ title() }}</caption>
        }
        <thead>
          <tr>
            <th scope="col">{{ labelHeader() }}</th>
            <th scope="col">{{ valueHeader() }}</th>
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track row.label) {
            <tr>
              <td>{{ row.label }}</td>
              <td>{{ row.formattedValue }}</td>
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

    .bar-chart {
      margin: 0;
      display: grid;
      gap: 12px;
      min-width: 0;
    }

    .bar-chart__title {
      color: var(--arc-ink);
      font-size: 16px;
      font-weight: 600;
      line-height: 24px;
    }

    .bar-chart__svg {
      display: block;
      width: 100%;
      max-width: 100%;
      height: auto;
    }

    .bar-chart__label {
      fill: var(--arc-muted);
      font-family: var(--arc-font-sans);
      font-size: 12px;
      font-weight: 500;
    }

    .bar-chart__track {
      fill: var(--arc-surface);
    }

    .bar-chart__value {
      fill: var(--arc-ink);
      font-family: var(--arc-font-sans);
      font-size: 12px;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorizontalBarChart {
  readonly title = input('');
  readonly items = input.required<readonly ChartDatum[]>();
  readonly labelHeader = input('Concepto');
  readonly valueHeader = input('Valor');
  readonly emptyTitle = input('Sin datos para mostrar');
  readonly emptyMessage = input('No hay registros disponibles en el periodo elegido.');

  protected readonly viewBoxWidth = VIEWBOX_WIDTH;
  protected readonly barX = BAR_X;
  protected readonly barMaxWidth = BAR_MAX_WIDTH;
  protected readonly valueX = VALUE_X;

  protected readonly hasData = computed(() =>
    this.items().some((item) => Number.isFinite(item.value) && item.value > 0),
  );

  protected readonly svgHeight = computed(() => Math.max(ROW_HEIGHT, this.items().length * ROW_HEIGHT));

  protected readonly rows = computed<readonly BarRow[]>(() => {
    const data = this.items();
    const peak = Math.max(1, ...data.map((item) => Math.max(0, item.value)));
    return data.map((item, index) => {
      const safeValue = Math.max(0, item.value);
      const width = safeValue > 0 ? Math.max(4, (safeValue / peak) * BAR_MAX_WIDTH) : 0;
      return {
        label: item.label,
        displayLabel: truncateLabel(item.label, 15),
        formattedValue: item.formattedValue ?? String(safeValue),
        value: safeValue,
        widthPercent: width,
        color: resolveChartToken(item.tone, index),
        y: index * ROW_HEIGHT,
      };
    });
  });
}

function truncateLabel(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}.` : text;
}
