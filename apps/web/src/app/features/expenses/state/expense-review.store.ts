import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from '@core/feedback/toast.service';
import { problemMessage } from '@core/http/problem-message';
import { Subscription, catchError, forkJoin, of } from 'rxjs';
import { ExpenseApi } from '../data-access/expense-api';
import {
  EvidenceLoadState,
  Expense,
  ExpenseDriverLookup,
  ExpenseStatusFilterValue,
  ExpenseTrayFilters,
  ExpenseTrayStatus,
  ExpenseTripLookup,
  UpdateExpenseStatusPayload,
} from '../models/expense.models';

const DEFAULT_PAGE_SIZE = 20;

/** Estado observable de la bandeja global de gastos y revisión de comprobantes (US23 y US24). */
@Injectable()
export class ExpenseReviewStore {
  private readonly api = inject(ExpenseApi);
  private readonly toasts = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly loadState = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  private readonly errorState = signal('');
  private readonly itemsState = signal<readonly Expense[]>([]);
  private readonly pageState = signal(0);
  private readonly sizeState = signal(DEFAULT_PAGE_SIZE);
  private readonly totalItemsState = signal(0);
  private readonly totalPagesState = signal(0);

  private readonly statusFilterState = signal<ExpenseStatusFilterValue>(
    'REGISTERED,PENDING_SUPPORT',
  );
  private readonly tripIdFilterState = signal('');
  private readonly driverIdFilterState = signal('');
  private readonly fromFilterState = signal('');
  private readonly toFilterState = signal('');

  private readonly tripsState = signal<readonly ExpenseTripLookup[]>([]);
  private readonly driversState = signal<readonly ExpenseDriverLookup[]>([]);
  private readonly selectedExpenseState = signal<Expense | null>(null);
  private readonly busyState = signal(false);
  private readonly actionErrorState = signal('');
  private readonly evidenceUrlState = signal<string | null>(null);
  private readonly evidenceLoadState = signal<EvidenceLoadState>('idle');

  private listRequest?: Subscription;
  private evidenceRequest?: Subscription;
  private lookupsLoaded = false;

  readonly state = this.loadState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly expenses = this.itemsState.asReadonly();
  readonly page = this.pageState.asReadonly();
  readonly size = this.sizeState.asReadonly();
  readonly totalItems = this.totalItemsState.asReadonly();
  readonly totalPages = this.totalPagesState.asReadonly();

  readonly statusFilter = this.statusFilterState.asReadonly();
  readonly tripIdFilter = this.tripIdFilterState.asReadonly();
  readonly driverIdFilter = this.driverIdFilterState.asReadonly();
  readonly fromFilter = this.fromFilterState.asReadonly();
  readonly toFilter = this.toFilterState.asReadonly();

  readonly trips = this.tripsState.asReadonly();
  readonly selectedExpense = this.selectedExpenseState.asReadonly();
  readonly busy = this.busyState.asReadonly();
  readonly actionError = this.actionErrorState.asReadonly();
  /** URL local del comprobante seleccionado; se revoca al cambiar o destruir la vista. */
  readonly evidenceUrl = this.evidenceUrlState.asReadonly();
  readonly evidenceState = this.evidenceLoadState.asReadonly();

  readonly selectableDrivers = computed(() =>
    this.driversState().filter(
      (driver): driver is ExpenseDriverLookup & { readonly userId: string } =>
        Boolean(driver.userId),
    ),
  );

  readonly tripCodesById = computed<Readonly<Record<string, string>>>(() => {
    const map: Record<string, string> = {};
    for (const trip of this.tripsState()) {
      map[trip.id] = trip.code;
    }
    return map;
  });

  readonly tripLabelsById = computed<Readonly<Record<string, string>>>(() => {
    const map: Record<string, string> = {};
    for (const trip of this.tripsState()) {
      map[trip.id] = `${trip.code} (${trip.origin} a ${trip.destination})`;
    }
    return map;
  });

  /** Cruza Expense.driverId (userId de IAM) con DriverResource.userId de Fleet (C2). */
  readonly driverNamesByUserId = computed<Readonly<Record<string, string>>>(() => {
    const map: Record<string, string> = {};
    for (const driver of this.driversState()) {
      if (driver.userId) {
        map[driver.userId] = driver.fullName;
      }
    }
    return map;
  });

  readonly hasActiveFilters = computed(() =>
    Boolean(
      this.statusFilterState() ||
        this.tripIdFilterState() ||
        this.driverIdFilterState() ||
        this.fromFilterState() ||
        this.toFilterState(),
    ),
  );

  readonly headerBadgeLabel = computed(() => {
    if (this.loadState() !== 'ready') return '';
    const total = this.totalItemsState();
    if (this.statusFilterState() === 'REGISTERED,PENDING_SUPPORT') {
      return `${total} por revisar`;
    }
    return `${total} ${total === 1 ? 'gasto' : 'gastos'}`;
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.listRequest?.unsubscribe();
      this.evidenceRequest?.unsubscribe();
      this.releaseEvidence();
    });
  }

  /** Carga catálogos auxiliares una sola vez y consulta la primera página según la ruta. */
  initialize(initialTripId?: string | null): void {
    this.loadLookupsOnce();
    const cleanTripId = initialTripId?.trim() ?? '';
    if (cleanTripId) {
      this.tripIdFilterState.set(cleanTripId);
      this.statusFilterState.set('');
    }
    this.loadPage(0);
  }

  setStatusFilter(status: ExpenseStatusFilterValue): void {
    this.statusFilterState.set(status);
    this.loadPage(0);
  }

  setTripFilter(tripId: string): void {
    this.tripIdFilterState.set(tripId);
    this.loadPage(0);
  }

  setDriverFilter(driverUserId: string): void {
    this.driverIdFilterState.set(driverUserId);
    this.loadPage(0);
  }

  setFromFilter(from: string): void {
    this.fromFilterState.set(from);
    this.loadPage(0);
  }

  setToFilter(to: string): void {
    this.toFilterState.set(to);
    this.loadPage(0);
  }

  clearFilters(): void {
    this.statusFilterState.set('');
    this.tripIdFilterState.set('');
    this.driverIdFilterState.set('');
    this.fromFilterState.set('');
    this.toFilterState.set('');
    this.loadPage(0);
  }

  goToPage(targetPage: number): void {
    if (targetPage < 0) return;
    this.loadPage(targetPage);
  }

  retry(): void {
    this.loadLookupsOnce();
    this.loadPage(this.pageState());
  }

  selectExpense(expense: Expense | null): void {
    const previous = this.selectedExpenseState();
    this.selectedExpenseState.set(expense);
    this.actionErrorState.set('');

    const nextUrl = expense?.evidence?.contentUrl ?? null;
    const prevUrl = previous?.evidence?.contentUrl ?? null;
    if (nextUrl && nextUrl === prevUrl && this.evidenceLoadState() === 'ready') {
      return;
    }
    this.loadEvidence(nextUrl);
  }

  approve(expenseId: string, onComplete?: () => void): void {
    if (this.busyState()) return;
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
    if (this.busyState()) return;

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

  private loadLookupsOnce(): void {
    if (this.lookupsLoaded) return;
    this.lookupsLoaded = true;
    forkJoin({
      trips: this.api.getTrips().pipe(catchError(() => of<ExpenseTripLookup[]>([]))),
      drivers: this.api.getDrivers().pipe(catchError(() => of<ExpenseDriverLookup[]>([]))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ trips, drivers }) => {
        this.tripsState.set(trips);
        this.driversState.set(drivers);
      });
  }

  private loadPage(targetPage: number): void {
    this.listRequest?.unsubscribe();
    this.pageState.set(targetPage);
    this.loadState.set('loading');
    this.errorState.set('');
    this.actionErrorState.set('');

    this.listRequest = this.api
      .getExpenses(this.buildFilters(targetPage))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.itemsState.set(response.items);
          this.pageState.set(response.page);
          this.sizeState.set(response.size);
          this.totalItemsState.set(response.totalItems);
          this.totalPagesState.set(response.totalPages);
          this.loadState.set('ready');

          const currentId = this.selectedExpenseState()?.id ?? null;
          const preserved = currentId
            ? response.items.find((item) => item.id === currentId)
            : undefined;
          this.selectExpense(preserved ?? response.items[0] ?? null);
        },
        error: (err) => {
          this.errorState.set(
            problemMessage(
              err,
              'Ocurrió un error al consultar el servicio de gastos. Reintenta en unos segundos.',
            ),
          );
          this.loadState.set('error');
        },
      });
  }

  private buildFilters(targetPage: number): ExpenseTrayFilters {
    const statusRaw = this.statusFilterState();
    const status: readonly ExpenseTrayStatus[] | ExpenseTrayStatus | undefined =
      statusRaw === 'REGISTERED,PENDING_SUPPORT'
        ? ['REGISTERED', 'PENDING_SUPPORT']
        : statusRaw || undefined;

    return {
      status,
      tripId: this.tripIdFilterState() || undefined,
      driverId: this.driverIdFilterState() || undefined,
      from: this.fromFilterState() || undefined,
      to: this.toFilterState() || undefined,
      page: targetPage,
      size: this.sizeState(),
    };
  }

  private replaceExpense(updated: Expense): void {
    this.itemsState.update((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
    if (this.selectedExpenseState()?.id === updated.id) {
      this.selectedExpenseState.set(updated);
    }
  }

  /** Descarga el comprobante autenticado; cancela cualquier petición previa antes de abrir otra. */
  private loadEvidence(contentUrl: string | null): void {
    this.evidenceRequest?.unsubscribe();
    this.releaseEvidence();
    if (!contentUrl) {
      this.evidenceLoadState.set('idle');
      return;
    }

    this.evidenceLoadState.set('loading');
    this.evidenceRequest = this.api
      .getEvidenceContent(contentUrl)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (file) => {
          this.evidenceUrlState.set(URL.createObjectURL(file));
          this.evidenceLoadState.set('ready');
        },
        error: () => this.evidenceLoadState.set('error'),
      });
  }

  private releaseEvidence(): void {
    const url = this.evidenceUrlState();
    if (url) {
      URL.revokeObjectURL(url);
    }
    this.evidenceUrlState.set(null);
  }
}
