import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Contenedor de tabla de datos que coordina la vista de escritorio y tarjetas móviles mediante _tables.scss. */
@Component({
  selector: 'app-data-table',
  template: `<div class="arc-table-wrap" [attr.role]="ariaLabel() ? 'region' : null" [attr.aria-label]="ariaLabel()">
    <ng-content />
  </div>`,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTable {
  readonly ariaLabel = input<string | null>(null);
}
