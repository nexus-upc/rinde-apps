import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subscription } from 'rxjs';
import { DemoRequestApi } from '../data-access/demo-request-api';
import {
  DemoRequest,
  DemoRequestField,
  DemoRequestFieldErrors,
} from '../models/demo-request.models';

const KNOWN_FIELDS: readonly DemoRequestField[] = [
  'fullName',
  'companyName',
  'email',
  'phone',
  'fleetSize',
  'message',
];

const INVALID_DATA = 'Revise los campos marcados.';
const DUPLICATE = 'Ya recibimos su solicitud. Lo contactaremos pronto.';
const CONNECTION = 'No se pudo conectar con el servidor. Intente nuevamente.';
const GENERIC = 'No se pudo enviar la solicitud. Intente nuevamente.';

/** Estado del envío de la solicitud de demostración; se provee en la página. */
@Injectable()
export class DemoRequestStore {
  private readonly api = inject(DemoRequestApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pendingState = signal(false);
  private readonly sentState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly fieldErrorsState = signal<DemoRequestFieldErrors>({});
  private subscription: Subscription | null = null;

  readonly pending = this.pendingState.asReadonly();
  readonly sent = this.sentState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly fieldErrors = this.fieldErrorsState.asReadonly();

  submit(request: DemoRequest): void {
    if (this.pendingState()) return;
    this.errorState.set(null);
    this.fieldErrorsState.set({});
    this.pendingState.set(true);
    this.subscription = this.api
      .submit(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.pendingState.set(false)),
      )
      .subscribe({
        next: () => this.sentState.set(true),
        error: (error: unknown) => this.fail(error),
      });
  }

  reset(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.pendingState.set(false);
    this.sentState.set(false);
    this.errorState.set(null);
    this.fieldErrorsState.set({});
  }

  private fail(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) {
      this.errorState.set(GENERIC);
      return;
    }
    const detail = detailOf(error);
    if (error.status === 400) {
      this.fieldErrorsState.set(fieldErrorsOf(error));
      this.errorState.set(detail ?? INVALID_DATA);
    } else if (error.status === 429) {
      this.errorState.set(detail ?? DUPLICATE);
    } else {
      this.errorState.set(error.status === 0 ? CONNECTION : GENERIC);
    }
  }
}

function detailOf(error: HttpErrorResponse): string | null {
  const body: unknown = error.error;
  if (typeof body !== 'object' || body === null) return null;
  const detail = (body as { detail?: unknown }).detail;
  return typeof detail === 'string' && detail.trim() !== '' ? detail : null;
}

function fieldErrorsOf(error: HttpErrorResponse): DemoRequestFieldErrors {
  const body: unknown = error.error;
  if (typeof body !== 'object' || body === null) return {};
  const errors = (body as { errors?: unknown }).errors;
  if (typeof errors !== 'object' || errors === null) return {};
  const source = errors as Record<string, unknown>;
  const result: Partial<Record<DemoRequestField, string>> = {};
  for (const field of KNOWN_FIELDS) {
    const message = source[field];
    if (typeof message === 'string') result[field] = message;
  }
  return result;
}
