import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { formatPen } from '@shared/formatters/formatters';
import { ConfirmDialog } from '@shared/ui/confirm-dialog/confirm-dialog';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { Pagination } from '@shared/ui/pagination/pagination';
import { StatePanel } from '@shared/ui/state-panel/state-panel';
import { StatusBadge } from '@shared/ui/status-badge/status-badge';
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_STATUS_FILTER_OPTIONS,
  Expense,
  ExpenseStatusFilterValue,
} from '../models/expense.models';
import { ExpenseReviewStore } from '../state/expense-review.store';
import { ExpenseDetailPanel } from '../ui/expense-detail-panel/expense-detail-panel';
import { ExpenseTable } from '../ui/expense-table/expense-table';

/** Bandeja global de gastos de la empresa con filtros, paginación y revisión (S4-12). */
@Component({
  selector: 'app-expense-review-page',
  providers: [ExpenseReviewStore],
  imports: [
    PageHeader,
    StatusBadge,
    FilterBar,
    Pagination,
    StatePanel,
    ConfirmDialog,
    ExpenseTable,
    ExpenseDetailPanel,
  ],
  templateUrl: './expense-review-page.html',
  styleUrl: './expense-review-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseReviewPage implements OnInit {
  protected readonly store = inject(ExpenseReviewStore);
  private readonly route = inject(ActivatedRoute);

  protected readonly statusOptions = EXPENSE_STATUS_FILTER_OPTIONS;
  protected readonly pendingApproval = signal<Expense | null>(null);

  protected readonly selectedTripCode = computed(() => {
    const selected = this.store.selectedExpense();
    if (!selected) return 'Viaje asignado';
    return this.store.tripCodesById()[selected.tripId] ?? 'Viaje asignado';
  });

  protected readonly selectedDriverName = computed(() => {
    const selected = this.store.selectedExpense();
    if (!selected) return 'Conductor registrado';
    return this.store.driverNamesByUserId()[selected.driverId] ?? 'Conductor registrado';
  });

  protected readonly approveDialogMessage = computed(() => {
    const item = this.pendingApproval();
    if (!item) return '';
    const category = (EXPENSE_CATEGORY_LABELS[item.category] ?? 'otros').toLowerCase();
    const amount =
      (item.currency || 'PEN') === 'PEN'
        ? formatPen(item.amount)
        : new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: item.currency,
          }).format(item.amount);
    const tripCode = this.store.tripCodesById()[item.tripId] ?? 'asignado';
    return `Se aprobará el gasto de ${category} por ${amount} del viaje ${tripCode} y se sumará al total de la liquidación.`;
  });

  ngOnInit(): void {
    const tripIdFromRoute =
      this.route.snapshot?.paramMap?.get('tripId') ??
      this.route.snapshot?.queryParamMap?.get('tripId') ??
      null;
    this.store.initialize(tripIdFromRoute);
  }

  protected onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as ExpenseStatusFilterValue;
    this.store.setStatusFilter(value);
  }

  protected onTripChange(event: Event): void {
    this.store.setTripFilter((event.target as HTMLSelectElement).value);
  }

  protected onDriverChange(event: Event): void {
    this.store.setDriverFilter((event.target as HTMLSelectElement).value);
  }

  protected onFromChange(event: Event): void {
    this.store.setFromFilter((event.target as HTMLInputElement).value);
  }

  protected onToChange(event: Event): void {
    this.store.setToFilter((event.target as HTMLInputElement).value);
  }

  onClearFilters(): void {
    this.store.clearFilters();
  }

  retry(): void {
    this.store.retry();
  }

  onSelectExpense(expense: Expense): void {
    this.store.selectExpense(expense);
  }

  onPageChange(targetPage: number): void {
    this.store.goToPage(targetPage);
  }

  onRequestApprove(expense: Expense): void {
    this.pendingApproval.set(expense);
  }

  onCancelApprove(): void {
    this.pendingApproval.set(null);
  }

  onConfirmApprove(): void {
    const target = this.pendingApproval();
    if (!target) return;
    this.store.approve(target.id, () => {
      this.pendingApproval.set(null);
    });
  }

  onApprove(expenseId: string): void {
    this.store.approve(expenseId, () => {
      this.pendingApproval.set(null);
    });
  }

  onObserve(payload: { readonly id: string; readonly reason: string }): void {
    this.store.observe(payload.id, payload.reason);
  }
}
