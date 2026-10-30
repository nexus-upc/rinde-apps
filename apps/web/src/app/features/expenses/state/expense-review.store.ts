import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from '@core/feedback/toast.service';
import { problemMessage } from '@core/http/problem-message';
import { ExpenseApi } from '../data-access/expense-api';
import { Expense, UpdateExpenseStatusPayload } from '../models/expense.models';

/** Estado y lógica para la revisión y aprobación/observación de gastos de un viaje (US24). */
@Injectable()
export class ExpenseReviewStore {
  private readonly api = inject(ExpenseApi);
  private readonly toasts = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly tripIdState = signal('');
  private readonly loadState = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  private readonly errorState = signal('');
  private readonly expensesState = signal<readonly Expense[]>([]);
  private readonly selectedExpenseState = signal<Expense | null>(null);
  private readonly busyState = signal(false);
  private readonly actionErrorState = signal('');

  readonly tripId = this.tripIdState.asReadonly();
  readonly state = this.loadState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly expenses = this.expensesState.asReadonly();
  readonly selectedExpense = this.selectedExpenseState.asReadonly();
  readonly busy = this.busyState.asReadonly();
  readonly actionError = this.actionErrorState.asReadonly();

  readonly totalExpenses = computed(() => this.expensesState().length);
  readonly approvedExpenses = computed(() =>
    this.expensesState().filter((e) => e.status === 'APPROVED'),
  );
  readonly observedExpenses = computed(() =>
    this.expensesState().filter((e) => e.status === 'OBSERVED'),
  );
  readonly pendingExpenses = computed(() =>
    this.expensesState().filter((e) => e.status === 'REGISTERED'),
  );
  readonly totalAmount = computed(() =>
    this.expensesState().reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
  );

  load(tripId: string): void {
    if (!tripId) return;
    this.tripIdState.set(tripId);
    this.loadState.set('loading');
    this.errorState.set('');
    this.actionErrorState.set('');

    this.api
      .getExpensesByTrip(tripId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (expenses) => {
          this.expensesState.set(expenses);
          this.loadState.set('ready');
        },
        error: (err) => {
          this.errorState.set(
            problemMessage(err, 'No fue posible cargar los gastos del viaje.'),
          );
          this.loadState.set('error');
        },
      });
  }

  selectExpense(expense: Expense | null): void {
    this.selectedExpenseState.set(expense);
    this.actionErrorState.set('');
  }

  clearActionError(): void {
    this.actionErrorState.set('');
  }

  approve(expenseId: string, onComplete?: () => void): void {
    this.busyState.set(true);
    this.actionErrorState.set('');

    const payload: UpdateExpenseStatusPayload = { status: 'APPROVED' };

    this.api
      .updateExpenseStatus(expenseId, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.busyState.set(false);
          this.replaceExpense(updated);
          this.toasts.show('Gasto aprobado exitosamente.');
          onComplete?.();
        },
        error: (err) => {
          this.busyState.set(false);
          const msg = problemMessage(err, 'No fue posible aprobar el gasto.');
          this.actionErrorState.set(msg);
          this.toasts.show(msg, 'danger');
        },
      });
  }

  observe(expenseId: string, reason: string, onComplete?: () => void): void {
    const trimmed = reason.trim();
    if (!trimmed) {
      this.actionErrorState.set('El motivo de observación es obligatorio.');
      return;
    }

    this.busyState.set(true);
    this.actionErrorState.set('');

    const payload: UpdateExpenseStatusPayload = {
      status: 'OBSERVED',
      reason: trimmed,
    };

    this.api
      .updateExpenseStatus(expenseId, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.busyState.set(false);
          this.replaceExpense(updated);
          this.toasts.show('Gasto observado con éxito.');
          onComplete?.();
        },
        error: (err) => {
          this.busyState.set(false);
          const msg = problemMessage(err, 'No fue posible observar el gasto.');
          this.actionErrorState.set(msg);
          this.toasts.show(msg, 'danger');
        },
      });
  }

  private replaceExpense(updated: Expense): void {
    this.expensesState.update((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
    if (this.selectedExpenseState()?.id === updated.id) {
      this.selectedExpenseState.set(updated);
    }
  }
}
