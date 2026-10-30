import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_STATUS_LABELS,
  Expense,
  ExpenseCategory,
  ExpenseStatus,
} from '../../models/expense.models';

/** Tabla de listado de gastos con acciones de revisión y aprobación rápida. */
@Component({
  selector: 'app-expense-table',
  imports: [CurrencyPipe, DecimalPipe, UiButton],
  templateUrl: './expense-table.html',
  styleUrl: './expense-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseTable {
  readonly expenses = input.required<readonly Expense[]>();
  readonly busy = input<boolean>(false);

  readonly reviewExpense = output<Expense>();
  readonly quickApprove = output<string>();

  getCategoryLabel(category: ExpenseCategory): string {
    return EXPENSE_CATEGORY_LABELS[category] ?? category;
  }

  getStatusLabel(status: ExpenseStatus): string {
    return EXPENSE_STATUS_LABELS[status] ?? status;
  }
}
