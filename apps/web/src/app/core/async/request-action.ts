import { DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, finalize } from 'rxjs';
import { problemMessage } from '../http/problem-message';

/** Estado local de una acción: bloquea envíos repetidos y cancela al salir de la pantalla. */
export class RequestAction {
  private readonly pendingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  readonly pending = this.pendingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  constructor(private readonly destroyRef: DestroyRef) {}
  clearError(): void {
    this.errorState.set(null);
  }
  run<T>(
    request: Observable<T>,
    options: {
      onSuccess: (value: T) => void;
      errorMessage: string;
      onError?: (message: string) => void;
    },
  ): boolean {
    if (this.pendingState()) return false;
    this.pendingState.set(true);
    this.clearError();
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.pendingState.set(false)),
      )
      .subscribe({
        next: (value) => options.onSuccess(value),
        error: (error: unknown) => {
          const message = problemMessage(error, options.errorMessage);
          this.errorState.set(message);
          options.onError?.(message);
        },
      });
    return true;
  }
}
