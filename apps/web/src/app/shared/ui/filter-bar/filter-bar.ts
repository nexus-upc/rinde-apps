import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiButton } from '../ui-button/ui-button';

/** Contenedor de presentación para campos de filtro con acción de limpiar. */
@Component({
  selector: 'app-filter-bar',
  imports: [UiButton],
  template: `<section class="filter-bar" [attr.aria-label]="ariaLabel()">
    <div class="filter-bar__fields">
      <ng-content />
    </div>
    <div class="filter-bar__actions">
      <button
        uiButton
        variant="ghost"
        type="button"
        class="filter-bar__clear"
        [disabled]="!canClear()"
        (click)="cleared.emit()"
      >
        {{ clearLabel() }}
      </button>
    </div>
  </section>`,
  styles: `
    :host {
      display: block;
    }

    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: end;
      gap: 12px 16px;
      padding: 16px;
      border-radius: var(--arc-radius-row);
      background: var(--arc-surface);
    }

    .filter-bar__fields {
      display: grid;
      flex: 1 1 260px;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      align-items: end;
      gap: 12px;
      min-width: 0;
    }

    .filter-bar__actions {
      display: flex;
      flex: none;
      align-items: center;
    }

    .filter-bar__clear {
      min-height: 44px;
    }

    @media (max-width: 640px) {
      .filter-bar {
        flex-direction: column;
        align-items: stretch;
      }

      .filter-bar__fields {
        flex: none;
        grid-template-columns: minmax(0, 1fr);
      }

      .filter-bar__actions,
      .filter-bar__clear {
        width: 100%;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterBar {
  readonly ariaLabel = input('Filtros');
  readonly clearLabel = input('Limpiar filtros');
  readonly canClear = input(true);
  readonly cleared = output<void>();
}
