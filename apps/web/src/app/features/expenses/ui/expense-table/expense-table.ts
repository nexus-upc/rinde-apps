import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { formatDate, formatPen } from '@shared/formatters/formatters';
import { DataTable } from '@shared/ui/data-table/data-table';
import { StatusBadge, StatusBadgeTone } from '@shared/ui/status-badge/status-badge';
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_STATUS_LABELS,
  Expense,
  ExpenseCategory,
  ExpenseStatus,
} from '../../models/expense.models';

/** Tabla responsiva de la bandeja global de gastos con fila seleccionable. */
@Component({
  selector: 'app-expense-table',
  imports: [DataTable, StatusBadge],
  templateUrl: './expense-table.html',
  styleUrl: './expense-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseTable {
  readonly expenses = input.required<readonly Expense[]>();
  readonly selectedExpenseId = input<string | null>(null);
  readonly tripCodes = input<Readonly<Record<string, string>>>({});
  readonly driverNames = input<Readonly<Record<string, string>>>({});

  readonly expenseSelected = output<Expense>();

  protected selectRow(expense: Expense): void {
    this.expenseSelected.emit(expense);
  }

  protected onRowKeydown(event: KeyboardEvent, expense: Expense): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.expenseSelected.emit(expense);
    }
  }

  protected formatExpenseDate(value: string): string {
    return formatDate(value);
  }

  protected formatExpenseAmount(amount: number, currency: string): string {
    const code = currency || 'PEN';
    if (code === 'PEN') {
      return formatPen(amount);
    }
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: code }).format(amount);
  }

  protected resolveTripCode(tripId: string): string {
    return this.tripCodes()[tripId] ?? 'Viaje asignado';
  }

  protected resolveDriverName(driverUserId: string): string {
    return this.driverNames()[driverUserId] ?? 'Conductor registrado';
  }

  protected getCategoryLabel(category: ExpenseCategory): string {
    return EXPENSE_CATEGORY_LABELS[category] ?? 'Otros';
  }

  protected getStatusLabel(expense: Expense): string {
    if (expense.isLocked) {
      return EXPENSE_STATUS_LABELS.LOCKED;
    }
    const status: ExpenseStatus = expense.status;
    return EXPENSE_STATUS_LABELS[status] ?? 'Registrado';
  }

  protected getStatusTone(expense: Expense): StatusBadgeTone {
    if (expense.isLocked || expense.status === 'LOCKED') return 'neutral';
    switch (expense.status) {
      case 'APPROVED':
        return 'success';
      case 'OBSERVED':
        return 'danger';
      case 'REGISTERED':
      case 'PENDING_SUPPORT':
      default:
        return 'wait';
    }
  }
}
