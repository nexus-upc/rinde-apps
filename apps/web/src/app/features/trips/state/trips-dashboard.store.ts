import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from '@core/feedback/toast.service';
import { problemMessage } from '@core/http/problem-message';
import { TripApi } from '../data-access/trip-api';
import {
  CreateTripPayload,
  TripFilters,
  TripStatus,
  TripSummary,
} from '../models/trip.models';

/** Estado y coordinación del tablero de viajes: listado y programación. */
@Injectable()
export class TripsDashboardStore {
  private readonly api = inject(TripApi);
  private readonly toasts = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  private readonly errorState = signal('');
  private readonly tripsState = signal<readonly TripSummary[]>([]);
  private readonly filtersState = signal<TripFilters>({});
  private readonly busyState = signal(false);
  private readonly actionErrorState = signal('');

  readonly state = this.loadState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly trips = this.tripsState.asReadonly();
  readonly busy = this.busyState.asReadonly();
  readonly actionError = this.actionErrorState.asReadonly();
  readonly activeStatusFilter = computed(() => this.filtersState().status ?? null);

  load(): void {
    if (this.busyState()) return;
    this.loadState.set('loading');
    this.errorState.set('');
    this.api
      .getTrips(this.filtersState())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (trips) => {
          this.tripsState.set(trips);
          this.loadState.set('ready');
        },
        error: (error: unknown) => {
          this.errorState.set(
            problemMessage(error, 'No se pudieron cargar los viajes. Intente nuevamente.'),
          );
          this.loadState.set('error');
        },
      });
  }

  filterByStatus(status: TripStatus | null): void {
    this.filtersState.set(status ? { status } : {});
    this.load();
  }

  create(payload: CreateTripPayload, onSuccess: () => void): void {
    if (this.busyState()) return;
    this.busyState.set(true);
    this.actionErrorState.set('');
    this.api
      .createTrip(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busyState.set(false);
          this.toasts.show('Viaje programado exitosamente.');
          onSuccess();
          this.load();
        },
        error: (error: unknown) => {
          this.busyState.set(false);
          this.actionErrorState.set(
            problemMessage(
              error,
              'No se pudo programar el viaje. Verifique los datos e intente nuevamente.',
            ),
          );
        },
      });
  }
}
