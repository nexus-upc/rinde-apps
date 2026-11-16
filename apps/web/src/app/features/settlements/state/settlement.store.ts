import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RequestAction } from '@core/async/request-action';
import { ToastService } from '@core/feedback/toast.service';
import { problemMessage } from '@core/http/problem-message';
import { Subscription, catchError, forkJoin, from, map, of, switchMap, throwError } from 'rxjs';
import { SettlementApi } from '../data-access/settlement-api';
import {
  CreateAdvancePayload,
  Settlement,
  SettlementExpenseStatusItem,
  SettlementTripOption,
  TripAdvance,
} from '../models/settlement.models';

type SettlementLookupResult =
  | { readonly found: true; readonly value: Settlement }
  | { readonly found: false; readonly message: string };

/** Estado y coordinación de anticipos y liquidación por viaje (US25, US26, US27 y US35). */
@Injectable()
export class SettlementStore {
  private readonly api = inject(SettlementApi);
  private readonly toasts = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);

  readonly tripsAction = new RequestAction(this.destroyRef);
  readonly registerAdvanceAction = new RequestAction(this.destroyRef);
  readonly recalculateAction = new RequestAction(this.destroyRef);
  readonly closeAction = new RequestAction(this.destroyRef);
  readonly exportAction = new RequestAction(this.destroyRef);

  private readonly tripsState = signal<readonly SettlementTripOption[]>([]);
  private readonly tripIdState = signal('');
  private readonly tripLoadState = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  private readonly tripLoadErrorState = signal('');
  private readonly advancesState = signal<readonly TripAdvance[]>([]);
  private readonly settlementState = signal<Settlement | null>(null);
  private readonly settlementNotFoundMessageState = signal<string | null>(null);
  private readonly pendingExpenseCountState = signal(0);
  private readonly confirmCloseOpenState = signal(false);
  private readonly advanceResetCounterState = signal(0);
  private tripRequest?: Subscription;

  readonly trips = this.tripsState.asReadonly();
  readonly tripId = this.tripIdState.asReadonly();
  readonly state = this.tripLoadState.asReadonly();
  readonly error = this.tripLoadErrorState.asReadonly();
  readonly advances = this.advancesState.asReadonly();
  readonly settlement = this.settlementState.asReadonly();
  readonly settlementNotFoundMessage = this.settlementNotFoundMessageState.asReadonly();
  readonly pendingExpenseCount = this.pendingExpenseCountState.asReadonly();
  readonly confirmCloseOpen = this.confirmCloseOpenState.asReadonly();
  readonly advanceResetCounter = this.advanceResetCounterState.asReadonly();

  readonly selectedTrip = computed(
    () => this.tripsState().find((trip) => trip.id === this.tripIdState()) ?? null,
  );

  readonly showPendingExpensesBanner = computed(
    () => this.settlementState()?.status === 'OPEN' && this.pendingExpenseCountState() > 0,
  );

  readonly settlementActionError = computed(
    () => this.recalculateAction.error() ?? this.exportAction.error(),
  );

  readonly settlementActionBusy = computed(
    () =>
      this.recalculateAction.pending() ||
      this.closeAction.pending() ||
      this.exportAction.pending(),
  );

  loadTrips(): void {
    this.tripsAction.run(this.api.getTrips(), {
      onSuccess: (trips) => this.tripsState.set(trips),
      errorMessage: 'No se pudo cargar la lista de viajes.',
    });
  }

  loadTrip(rawTripId: string): void {
    const tripId = rawTripId.trim();
    if (!tripId) return;

    this.tripRequest?.unsubscribe();
    this.clearActionErrors();
    this.confirmCloseOpenState.set(false);
    this.tripIdState.set(tripId);
    this.tripLoadState.set('loading');
    this.tripLoadErrorState.set('');
    this.settlementNotFoundMessageState.set(null);

    const settlementLookup$ = this.api.getSettlementByTrip(tripId).pipe(
      map((value): SettlementLookupResult => ({ found: true, value })),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          return of<SettlementLookupResult>({
            found: false,
            message: problemMessage(error, 'No existe liquidación para este viaje.'),
          });
        }
        return throwError(() => error);
      }),
    );

    const expensesLookup$ = this.api
      .getTripExpenses(tripId)
      .pipe(catchError(() => of<SettlementExpenseStatusItem[]>([])));

    this.tripRequest = forkJoin({
      advances: this.api.getAdvancesByTrip(tripId),
      settlement: settlementLookup$,
      expenses: expensesLookup$,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ advances, settlement, expenses }) => {
          this.advancesState.set(advances);
          const unreviewedFromExpenses = countUnreviewedExpenses(expenses);
          if (settlement.found) {
            this.settlementState.set(settlement.value);
            this.settlementNotFoundMessageState.set(null);
            this.pendingExpenseCountState.set(
              settlement.value.pendingExpenseCount ?? unreviewedFromExpenses,
            );
          } else {
            this.settlementState.set(null);
            this.settlementNotFoundMessageState.set(settlement.message);
            this.pendingExpenseCountState.set(unreviewedFromExpenses);
          }
          this.tripLoadState.set('ready');
        },
        error: (error: unknown) => {
          this.tripLoadErrorState.set(
            problemMessage(
              error,
              'No fue posible consultar los anticipos y la liquidación del viaje.',
            ),
          );
          this.tripLoadState.set('error');
        },
      });
  }

  registerAdvance(payload: CreateAdvancePayload): void {
    const tripId = this.tripIdState();
    if (!tripId) return;

    this.registerAdvanceAction.run(this.api.registerAdvance(tripId, payload), {
      onSuccess: (created) => {
        this.advancesState.update((current) => [created, ...current]);
        this.advanceResetCounterState.update((count) => count + 1);
        this.toasts.show('Anticipo registrado correctamente.');
      },
      onError: (message) => this.toasts.show(message, 'danger'),
      errorMessage: 'No fue posible registrar el anticipo.',
    });
  }

  recalculateSettlement(): void {
    const current = this.settlementState();
    if (!current || this.settlementActionBusy()) return;

    this.exportAction.clearError();
    this.recalculateAction.run(this.api.recalculateSettlement(current.id), {
      onSuccess: (updated) => {
        this.settlementState.set(updated);
        if (typeof updated.pendingExpenseCount === 'number') {
          this.pendingExpenseCountState.set(updated.pendingExpenseCount);
        }
        this.toasts.show('Liquidación recalculada correctamente.');
      },
      onError: (message) => this.toasts.show(message, 'danger'),
      errorMessage: 'No fue posible recalcular la liquidación.',
    });
  }

  openCloseModal(): void {
    if (!this.settlementState()) return;
    this.closeAction.clearError();
    this.confirmCloseOpenState.set(true);
  }

  dismissCloseModal(): void {
    if (!this.closeAction.pending()) {
      this.closeAction.clearError();
      this.confirmCloseOpenState.set(false);
    }
  }

  confirmCloseSettlement(): void {
    const current = this.settlementState();
    if (!current) return;

    this.closeAction.run(this.api.closeSettlement(current.id), {
      onSuccess: (updated) => {
        this.settlementState.set(updated);
        this.confirmCloseOpenState.set(false);
        this.toasts.show('Liquidación cerrada correctamente.');
      },
      onError: (message) => this.toasts.show(message, 'danger'),
      errorMessage: 'No fue posible cerrar la liquidación.',
    });
  }

  exportCsv(): void {
    const current = this.settlementState();
    if (!current || this.settlementActionBusy()) return;

    this.recalculateAction.clearError();
    const request$ = this.api.exportSettlementCsv(current.id).pipe(
      catchError((error: unknown) => {
        if (
          error instanceof HttpErrorResponse &&
          error.error instanceof Blob &&
          typeof error.error.text === 'function'
        ) {
          return from(error.error.text()).pipe(
            switchMap((text) => {
              let parsed: unknown = error.error;
              try {
                parsed = JSON.parse(text);
              } catch {
                // Mantiene el mensaje fallback cuando el servidor no responde JSON.
              }
              return throwError(
                () =>
                  new HttpErrorResponse({
                    error: parsed,
                    headers: error.headers,
                    status: error.status,
                    statusText: error.statusText,
                    url: error.url ?? undefined,
                  }),
              );
            }),
          );
        }
        return throwError(() => error);
      }),
    );

    this.exportAction.run(request$, {
      onSuccess: (response) => {
        const blob = response.body;
        if (!blob) {
          this.toasts.show('No se recibió contenido CSV del servidor.', 'danger');
          return;
        }
        const filename = extractCsvFilename(
          response.headers.get('Content-Disposition'),
          current.id,
        );
        this.downloadBlob(blob, filename);
        this.toasts.show('Liquidación exportada en CSV.');
      },
      onError: (message) => this.toasts.show(message, 'danger'),
      errorMessage: 'No fue posible descargar el archivo CSV de liquidación.',
    });
  }

  private clearActionErrors(): void {
    this.registerAdvanceAction.clearError();
    this.recalculateAction.clearError();
    this.closeAction.clearError();
    this.exportAction.clearError();
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = this.document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    this.document.body.appendChild(link);
    link.click();
    this.document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

function countUnreviewedExpenses(expenses: readonly SettlementExpenseStatusItem[]): number {
  return expenses.filter(
    (expense) => expense.status === 'REGISTERED' || expense.status === 'PENDING_SUPPORT',
  ).length;
}

function extractCsvFilename(headerValue: string | null, settlementId: string): string {
  const match = headerValue?.match(/filename="?([^";\n]+)"?/i);
  const raw = match?.[1]?.trim();
  return raw || `settlement-${settlementId}.csv`;
}
