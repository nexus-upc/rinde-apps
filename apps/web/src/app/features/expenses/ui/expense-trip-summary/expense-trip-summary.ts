import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ExpenseTripSummaryData } from '../../models/expense.models';

/** Resumen numérico por estado y monto total aprobado de los gastos de un viaje (US23). */
@Component({
  selector: 'app-expense-trip-summary',
  imports: [CurrencyPipe],
  templateUrl: './expense-trip-summary.html',
  styleUrl: './expense-trip-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseTripSummary {
  readonly summary = input.required<ExpenseTripSummaryData>();
}
