import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_STATUS_LABELS,
  Expense,
  ExpenseCategory,
  ExpenseStatus,
} from '../../models/expense.models';

/** Modal para revisar los detalles de un gasto, ver el comprobante y aprobarlo u observarlo (US24). */
@Component({
  selector: 'app-expense-review-modal',
  imports: [CurrencyPipe, DecimalPipe, FormsModule, UiButton],
  templateUrl: './expense-review-modal.html',
  styleUrl: './expense-review-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseReviewModal {
  readonly expense = input<Expense | null>(null);
  readonly busy = input<boolean>(false);
  readonly actionError = input<string>('');

  readonly closeModal = output<void>();
  readonly approve = output<string>();
  readonly observe = output<{ id: string; reason: string }>();
  readonly clearError = output<void>();

  protected readonly observationReason = signal('');

  constructor() {
    effect(() => {
      const exp = this.expense();
      if (exp?.observationReason) {
        this.observationReason.set(exp.observationReason);
      } else {
        this.observationReason.set('');
      }
    });
  }

  onReasonInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement | null;
    this.observationReason.set(target?.value ?? '');
    if (this.actionError()) {
      this.clearError.emit();
    }
  }

  getCategoryLabel(category?: ExpenseCategory): string {
    return category ? EXPENSE_CATEGORY_LABELS[category] ?? category : '';
  }

  getStatusLabel(status?: ExpenseStatus): string {
    return status ? EXPENSE_STATUS_LABELS[status] ?? status : '';
  }

  isImage(contentType?: string): boolean {
    return Boolean(contentType?.startsWith('image/'));
  }

  onApprove(): void {
    const exp = this.expense();
    if (exp) {
      this.approve.emit(exp.id);
    }
  }

  onObserve(): void {
    const exp = this.expense();
    const reason = this.observationReason().trim();
    if (exp) {
      this.observe.emit({
        id: exp.id,
        reason,
      });
    }
  }
}
