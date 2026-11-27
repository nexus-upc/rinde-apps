import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { formatDateTime, formatPen } from '@shared/formatters/formatters';
import { StatusBadge, StatusBadgeTone } from '@shared/ui/status-badge/status-badge';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_CONTENT_TYPE_LABELS,
  EXPENSE_STATUS_LABELS,
  EvidenceLoadState,
  Expense,
} from '../../models/expense.models';

/** Panel lateral de inspección del comprobante y acciones de revisión (US24). */
@Component({
  selector: 'app-expense-detail-panel',
  imports: [StatusBadge, UiButton],
  templateUrl: './expense-detail-panel.html',
  styleUrl: './expense-detail-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseDetailPanel {
  readonly expense = input<Expense | null>(null);
  readonly tripCode = input('Viaje asignado');
  readonly driverName = input('Conductor registrado');
  readonly evidenceUrl = input<string | null>(null);
  readonly evidenceState = input<EvidenceLoadState>('idle');
  readonly busy = input(false);
  readonly actionError = input('');

  readonly approveRequested = output<Expense>();
  readonly observeRequested = output<{ readonly id: string; readonly reason: string }>();

  protected readonly reasonText = signal('');
  protected readonly validationError = signal('');
  private syncedExpenseId: string | null = null;

  constructor() {
    effect(() => {
      const current = this.expense();
      const nextId = current?.id ?? null;
      if (nextId !== this.syncedExpenseId) {
        this.syncedExpenseId = nextId;
        this.reasonText.set(current?.observationReason ?? '');
        this.validationError.set('');
      }
    });
  }

  protected onReasonInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.reasonText.set(value);
    if (value.trim() && this.validationError()) {
      this.validationError.set('');
    }
  }

  protected requestApprove(item: Expense): void {
    if (this.busy()) return;
    this.validationError.set('');
    this.approveRequested.emit(item);
  }

  protected requestObserve(item: Expense): void {
    if (this.busy()) return;
    const trimmed = this.reasonText().trim();
    if (!trimmed) {
      this.validationError.set('Ingresa el motivo de observación antes de continuar.');
      return;
    }
    this.validationError.set('');
    this.observeRequested.emit({ id: item.id, reason: trimmed });
  }

  protected getCategoryLabel(item: Expense): string {
    return EXPENSE_CATEGORY_LABELS[item.category] ?? 'Otros';
  }

  protected getStatusLabel(item: Expense): string {
    if (item.isLocked) return EXPENSE_STATUS_LABELS.LOCKED;
    return EXPENSE_STATUS_LABELS[item.status] ?? 'Registrado';
  }

  protected getStatusTone(item: Expense): StatusBadgeTone {
    if (item.isLocked || item.status === 'LOCKED') return 'neutral';
    switch (item.status) {
      case 'APPROVED':
        return 'success';
      case 'OBSERVED':
        return 'danger';
      default:
        return 'wait';
    }
  }

  protected formatAmount(amount: number, currency: string): string {
    const code = currency || 'PEN';
    if (code === 'PEN') return formatPen(amount);
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: code }).format(amount);
  }

  protected formatContentType(contentType: string): string {
    return EXPENSE_CONTENT_TYPE_LABELS[contentType] ?? 'Archivo';
  }

  protected formatFileSize(bytes: number): string {
    const kb = Math.max(1, Math.round(bytes / 1024));
    return `${kb} KB`;
  }

  protected formatUploadedAt(uploadedAt: string): string {
    return formatDateTime(uploadedAt);
  }

  protected isImage(contentType: string): boolean {
    return contentType.startsWith('image/');
  }

  protected isLockedExpense(item: Expense): boolean {
    return Boolean(item.isLocked) || item.status === 'LOCKED';
  }
}
