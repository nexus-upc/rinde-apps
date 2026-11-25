import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { UiButton } from '../ui-button/ui-button';

/** Navegación entre páginas base cero usando el formato paginado del contrato. */
@Component({
  selector: 'app-pagination',
  imports: [UiButton],
  template: `<nav class="pagination" [attr.aria-label]="ariaLabel()">
    <button
      uiButton
      variant="secondary"
      type="button"
      class="pagination__action"
      aria-label="Página anterior"
      [disabled]="disabled() || !hasPrevious()"
      (click)="goTo(currentPage() - 1)"
    >
      Anterior
    </button>
    <span class="pagination__summary" aria-live="polite">
      Página {{ displayPage() }} de {{ totalPages() }}
    </span>
    <button
      uiButton
      variant="secondary"
      type="button"
      class="pagination__action"
      aria-label="Página siguiente"
      [disabled]="disabled() || !hasNext()"
      (click)="goTo(currentPage() + 1)"
    >
      Siguiente
    </button>
  </nav>`,
  styles: `
    :host {
      display: block;
    }

    .pagination {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding-top: 8px;
    }

    .pagination__summary {
      color: var(--arc-muted);
      font-size: 13px;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      text-align: center;
    }

    .pagination__action {
      min-height: 44px;
    }

    @media (max-width: 480px) {
      .pagination__summary {
        order: -1;
        flex-basis: 100%;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pagination {
  readonly page = input.required<number>();
  readonly size = input.required<number>();
  readonly totalItems = input.required<number>();
  readonly disabled = input(false);
  readonly ariaLabel = input('Paginación');
  readonly pageChange = output<number>();

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(Math.max(0, this.totalItems()) / Math.max(1, this.size()))),
  );
  protected readonly currentPage = computed(() =>
    Math.min(Math.max(0, this.page()), this.totalPages() - 1),
  );
  protected readonly displayPage = computed(() => this.currentPage() + 1);
  protected readonly hasPrevious = computed(() => this.currentPage() > 0);
  protected readonly hasNext = computed(() => this.currentPage() + 1 < this.totalPages());

  protected goTo(targetPage: number): void {
    if (this.disabled()) return;
    if (targetPage < 0 || targetPage >= this.totalPages() || targetPage === this.currentPage()) {
      return;
    }
    this.pageChange.emit(targetPage);
  }
}
