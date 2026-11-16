import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RequestAction } from '@core/async/request-action';
import { ToastService } from '@core/feedback/toast.service';
import { catchError, forkJoin, of } from 'rxjs';
import { IncidentApi } from '../data-access/incident-api';
import {
  Incident,
  IncidentFilters,
  IncidentStatus,
  IncidentTripOption,
  IncidentVehicleOption,
} from '../models/incident.models';

/** Gestión de estado para consulta, seguimiento y cierre de incidencias (US30 y US31). */
@Injectable()
export class IncidentStore {
  private readonly api = inject(IncidentApi);
  private readonly toasts = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly listAction = new RequestAction(this.destroyRef);
  readonly detailAction = new RequestAction(this.destroyRef);
  readonly statusAction = new RequestAction(this.destroyRef);
  readonly closeAction = new RequestAction(this.destroyRef);

  private readonly incidentsState = signal<readonly Incident[]>([]);
  private readonly tripsState = signal<readonly IncidentTripOption[]>([]);
  private readonly vehiclesState = signal<readonly IncidentVehicleOption[]>([]);
  private readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  private readonly statusFilterState = signal<IncidentStatus | ''>('');
  private readonly tripIdFilterState = signal('');
  private readonly vehicleIdFilterState = signal('');
  private readonly selectedIncidentState = signal<Incident | null>(null);
  private readonly closingIncidentState = signal<Incident | null>(null);

  readonly incidents = this.incidentsState.asReadonly();
  readonly trips = this.tripsState.asReadonly();
  readonly vehicles = this.vehiclesState.asReadonly();
  readonly state = this.loadState.asReadonly();
  readonly error = this.listAction.error;
  readonly statusFilter = this.statusFilterState.asReadonly();
  readonly tripIdFilter = this.tripIdFilterState.asReadonly();
  readonly vehicleIdFilter = this.vehicleIdFilterState.asReadonly();
  readonly selectedIncident = this.selectedIncidentState.asReadonly();
  readonly closingIncident = this.closingIncidentState.asReadonly();

  readonly countLabel = computed(() => {
    const len = this.incidentsState().length;
    return len === 1 ? '1 incidencia' : `${len} incidencias`;
  });

  readonly tripLabels = computed(() => {
    const map: Record<string, string> = {};
    for (const trip of this.tripsState()) {
      map[trip.id] = `${trip.code} · ${trip.origin} → ${trip.destination}`;
    }
    return map;
  });

  readonly vehicleLabels = computed(() => {
    const map: Record<string, string> = {};
    for (const vehicle of this.vehiclesState()) {
      map[vehicle.id] = `${vehicle.plateNumber} · ${vehicle.brand} ${vehicle.model}`;
    }
    return map;
  });

  loadInitial(initialFilters?: IncidentFilters): void {
    if (initialFilters?.status !== undefined) {
      this.statusFilterState.set(initialFilters.status);
    }
    if (initialFilters?.tripId !== undefined) {
      this.tripIdFilterState.set(initialFilters.tripId);
    }
    if (initialFilters?.vehicleId !== undefined) {
      this.vehicleIdFilterState.set(initialFilters.vehicleId);
    }

    forkJoin({
      trips: this.api.getTrips().pipe(catchError(() => of<IncidentTripOption[]>([]))),
      vehicles: this.api.getVehicles().pipe(catchError(() => of<IncidentVehicleOption[]>([]))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ trips, vehicles }) => {
        this.tripsState.set(trips);
        this.vehiclesState.set(vehicles);
      });

    this.loadIncidents();
  }

  loadIncidents(): void {
    this.loadState.set('loading');
    this.listAction.run(
      this.api.getIncidents({
        status: this.statusFilterState(),
        tripId: this.tripIdFilterState(),
        vehicleId: this.vehicleIdFilterState(),
      }),
      {
        onSuccess: (items) => {
          this.incidentsState.set(items);
          this.loadState.set('ready');
        },
        onError: () => this.loadState.set('error'),
        errorMessage: 'No se pudieron cargar las incidencias.',
      },
    );
  }

  applyFilters(filters: IncidentFilters): void {
    this.statusFilterState.set(filters.status ?? '');
    this.tripIdFilterState.set(filters.tripId ?? '');
    this.vehicleIdFilterState.set(filters.vehicleId ?? '');
    this.loadIncidents();
  }

  resetFilters(): void {
    this.statusFilterState.set('');
    this.tripIdFilterState.set('');
    this.vehicleIdFilterState.set('');
    this.loadIncidents();
  }

  openDetail(incident: Incident): void {
    this.statusAction.clearError();
    this.detailAction.clearError();
    this.selectedIncidentState.set(incident);

    this.detailAction.run(this.api.getIncident(incident.id), {
      onSuccess: (fresh) => {
        this.replaceIncident(fresh);
      },
      errorMessage: 'No se pudo actualizar el detalle de la incidencia.',
    });
  }

  openDetailById(incidentId: string): void {
    this.statusAction.clearError();
    this.detailAction.clearError();
    this.detailAction.run(this.api.getIncident(incidentId), {
      onSuccess: (fresh) => {
        this.selectedIncidentState.set(fresh);
        this.replaceIncident(fresh);
      },
      onError: (msg) => this.toasts.show(msg, 'danger'),
      errorMessage: 'No se pudo consultar la incidencia solicitada.',
    });
  }

  closeDetail(): void {
    if (this.statusAction.pending() || this.closeAction.pending()) return;
    this.statusAction.clearError();
    this.detailAction.clearError();
    this.selectedIncidentState.set(null);
  }

  moveToInProgress(incidentId: string): void {
    this.statusAction.run(
      this.api.updateStatus(incidentId, { status: 'IN_PROGRESS' }),
      {
        onSuccess: (updated) => {
          this.replaceIncident(updated);
          this.toasts.show('Incidencia marcada En atención.');
        },
        onError: (msg) => this.toasts.show(msg, 'danger'),
        errorMessage: 'No fue posible actualizar el estado de la incidencia.',
      },
    );
  }

  openCloseModal(incident: Incident): void {
    this.closeAction.clearError();
    this.closingIncidentState.set(incident);
  }

  dismissCloseModal(): void {
    if (!this.closeAction.pending()) {
      this.closeAction.clearError();
      this.closingIncidentState.set(null);
    }
  }

  confirmCloseIncident(action: string): void {
    const target = this.closingIncidentState();
    const trimmed = action.trim();
    if (!target || !trimmed) return;

    this.closeAction.run(this.api.closeIncident(target.id, { action: trimmed }), {
      onSuccess: (updated) => {
        this.replaceIncident(updated);
        this.closingIncidentState.set(null);
        this.selectedIncidentState.set(updated);
        this.toasts.show('Incidencia cerrada correctamente.');
      },
      onError: (msg) => this.toasts.show(msg, 'danger'),
      errorMessage: 'No fue posible cerrar la incidencia.',
    });
  }

  private replaceIncident(updated: Incident): void {
    this.incidentsState.update((list) =>
      list.map((item) => (item.id === updated.id ? updated : item)),
    );
    if (this.selectedIncidentState()?.id === updated.id) {
      this.selectedIncidentState.set(updated);
    }
    if (this.closingIncidentState()?.id === updated.id) {
      this.closingIncidentState.set(updated);
    }
  }
}
