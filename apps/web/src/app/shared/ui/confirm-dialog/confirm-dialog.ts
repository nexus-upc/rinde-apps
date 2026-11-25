import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { UiButton } from '../ui-button/ui-button';

let nextDialogId = 0;

/** Diálogo modal de confirmación con foco atrapado, cierre por Escape y acción principal de tinta. */
@Component({
  selector: 'app-confirm-dialog',
  imports: [UiButton],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel = input('Cancelar');
  readonly pending = input(false);
  readonly error = input<string | null>(null);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  protected readonly titleId = `confirm-dialog-title-${++nextDialogId}`;
  protected readonly messageId = `confirm-dialog-message-${nextDialogId}`;

  private readonly document = inject(DOCUMENT);
  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly cancelRef = viewChild<UiButton, ElementRef<HTMLButtonElement>>('cancelButton', {
    read: ElementRef,
  });
  private previousFocus: HTMLElement | null = null;
  private wasOpen = false;

  constructor() {
    effect(() => {
      const isOpen = this.open();
      const dialog = this.dialogRef().nativeElement;
      if (isOpen && !this.wasOpen) {
        this.wasOpen = true;
        this.previousFocus = this.document.activeElement as HTMLElement | null;
        this.showDialog(dialog);
        queueMicrotask(() => this.focusInitialElement(dialog));
      } else if (!isOpen && this.wasOpen) {
        this.wasOpen = false;
        this.hideDialog(dialog);
        this.restoreFocus();
      }
    });
  }

  protected requestCancel(): void {
    if (!this.pending()) {
      this.cancelled.emit();
    }
  }

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.requestCancel();
    }
  }

  protected onCancel(event: Event): void {
    event.preventDefault();
    this.requestCancel();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.requestCancel();
      return;
    }
    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  private showDialog(dialog: HTMLDialogElement): void {
    if (dialog.hasAttribute('open')) return;
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  }

  private hideDialog(dialog: HTMLDialogElement): void {
    if (typeof dialog.close === 'function' && dialog.open) {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
  }

  private focusInitialElement(dialog: HTMLDialogElement): void {
    if (!this.open()) return;
    const cancel = this.cancelRef()?.nativeElement;
    if (cancel && !cancel.disabled) {
      cancel.focus();
      return;
    }
    dialog.focus();
  }

  private restoreFocus(): void {
    if (this.previousFocus && this.previousFocus.isConnected) {
      this.previousFocus.focus();
    }
    this.previousFocus = null;
  }

  private trapFocus(event: KeyboardEvent): void {
    const dialog = this.dialogRef().nativeElement;
    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])',
      ),
    );
    if (!focusables.length) {
      event.preventDefault();
      return;
    }
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    const active = this.document.activeElement;

    if (event.shiftKey && (active === first || active === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
