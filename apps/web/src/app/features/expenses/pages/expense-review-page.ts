import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatePanel } from '@shared/ui/state-panel/state-panel';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import { Expense } from '../models/expense.models';
import { ExpenseReviewStore } from '../state/expense-review.store';
import { ExpenseReviewModal } from '../ui/expense-review-modal/expense-review-modal';
import { ExpenseTable } from '../ui/expense-table/expense-table';
import { ExpenseTripSummary } from '../ui/expense-trip-summary/expense-trip-summary';

/** Página contenedora para la revisión y aprobación de gastos de un viaje (US23 y US24). */
@Component({
  selector: 'app-expense-review-page',
  providers: [ExpenseReviewStore],
  imports: [
    FormsModule,
    RouterLink,
    PageHeader,
    StatePanel,
    UiButton,
    ExpenseTripSummary,
    ExpenseTable,
    ExpenseReviewModal,
  ],
  templateUrl: './expense-review-page.html',
  styleUrl: './expense-review-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseReviewPage implements OnInit {
  protected readonly store = inject(ExpenseReviewStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly inputTripId = signal('');

  ngOnInit(): void {
    const tripIdFromRoute =
      this.route.snapshot.paramMap?.get('tripId') ??
      this.route.snapshot.queryParamMap?.get('tripId');
    if (tripIdFromRoute) {
      this.inputTripId.set(tripIdFromRoute);
      this.store.load(tripIdFromRoute);
    }
  }

  searchTrip(): void {
    const tripId = this.inputTripId().trim();
    if (tripId) {
      this.store.load(tripId);
    }
  }

  retry(): void {
    if (this.inputTripId()) {
      this.store.load(this.inputTripId());
    }
  }

  onReviewExpense(expense: Expense): void {
    this.store.selectExpense(expense);
  }

  onCloseModal(): void {
    this.store.selectExpense(null);
  }

  onQuickApprove(expenseId: string): void {
    this.store.approve(expenseId);
  }

  onApprove(expenseId: string): void {
    this.store.approve(expenseId, () => {
      this.store.selectExpense(null);
    });
  }

  onObserve(payload: { id: string; reason: string }): void {
    this.store.observe(payload.id, payload.reason, () => {
      this.store.selectExpense(null);
    });
  }

  goBack(): void {
    void this.router.navigate(['/trips']);
  }
}
