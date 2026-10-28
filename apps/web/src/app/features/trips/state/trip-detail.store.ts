import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from '@core/feedback/toast.service';
import { problemMessage } from '@core/http/problem-message';
import { forkJoin } from 'rxjs';
import { TripApi } from '../data-access/trip-api';
import {
  DriverSummary,
  TripDetail,
  VehicleSummary,
} from '../models/trip.models';

/** Estado y coordinación de la pantalla de detalle y asignación de viaje. */
@Injectable()
export class TripDetailStore {
  private readonly api = inject(TripApi);
  private readonly toasts = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  private readonly errorState = signal('');
  private readonly tripState = signal<TripDetail | null>(null);
  private readonly vehiclesState = signal<readonly VehicleSummary[]>([]);
  private readonly driversState = signal<readonly DriverSummary[]>([]);
  private readonly selectedVehicleIdState = signal('');
  private readonly selectedDriverIdState = signal('');
  private readonly confirmOverdueState = signal(false);
  private readonly overdueRequiresConfirmationState = signal(false);
  private readonly maintenanceAlertState = signal<string | null>(null);
  private readonly busyState = signal(false);
  private readonly actionErrorState = signal('');

  readonly state = this.loadState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly trip = this.tripState.asReadonly();
  readonly vehicles = this.vehiclesState.asReadonly();
  readonly drivers = this.driversState.asReadonly();
  readonly selectedVehicleId = this.selectedVehicleIdState.asReadonly();
  readonly selectedDriverId = this.selectedDriverIdState.asReadonly();
  readonly confirmOverdue = this.confirmOverdueState.asReadonly();
  readonly overdueRequiresConfirmation = this.overdueRequiresConfirmationState.asReadonly();
  readonly maintenanceAlert = this.maintenanceAlertState.asReadonly();
  readonly busy = this.busyState.asReadonly();
  readonly actionError = this.actionErrorState.asReadonly();

  readonly canAssign = computed(() => this.tripState()?.status === 'SCHEDULED');

  readonly assignedVehicle = computed(() => {
    const id = this.tripState()?.vehicleId;
    return id ? this.vehiclesState().find((v) => v.id === id) ?? null : null;
  });

  readonly assignedDriver = computed(() => {
    const id = this.tripState()?.driverId;
    return id ? this.driversState().find((d) => d.id === id) ?? null : null;
  });

  load(tripId: string): void {
    if (this.busyState()) return;
    this.loadState.set('loading');
    this.errorState.set('');
    this.actionErrorState.set('');

    forkJoin({
      trip: this.api.getTrip(tripId),
      vehicles: this.api.getVehicles(),
      drivers: this.api.getDrivers(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ trip, vehicles, drivers }) => {
          this.tripState.set(trip);
          this.vehiclesState.set(vehicles);
          this.driversState.set(drivers);
          this.selectedVehicleIdState.set(trip.vehicleId ?? (vehicles[0]?.id ?? ''));
          this.selectedDriverIdState.set(trip.driverId ?? (drivers[0]?.id ?? ''));
          this.loadState.set('ready');
        },
        error: (error: unknown) => {
          this.errorState.set(
            problemMessage(error, 'No se pudo cargar el detalle del viaje. Intente nuevamente.'),
          );
          this.loadState.set('error');
        },
      });
  }

  selectVehicle(vehicleId: string): void {
    if (!this.busyState()) {
      this.selectedVehicleIdState.set(vehicleId);
      this.actionErrorState.set('');
    }
  }

  selectDriver(driverId: string): void {
    if (!this.busyState()) {
      this.selectedDriverIdState.set(driverId);
      this.actionErrorState.set('');
    }
  }

  setConfirmOverdue(confirm: boolean): void {
    this.confirmOverdueState.set(confirm);
    this.actionErrorState.set('');
  }

  assign(): void {
    const trip = this.tripState();
    const vehicleId = this.selectedVehicleIdState();
    const driverId = this.selectedDriverIdState();

    if (!trip || !vehicleId || !driverId || this.busyState()) return;

    this.busyState.set(true);
    this.actionErrorState.set('');

    this.api
      .assignTrip(trip.id, {
        vehicleId,
        driverId,
        confirmOverdueMaintenance: this.confirmOverdueState(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.tripState.update((current) =>
            current
              ? {
                  ...current,
                  status: response.status,
                  vehicleId: response.vehicleId,
                  driverId: response.driverId,
                  assignedAt: response.assignedAt,
                }
              : null,
          );
          this.maintenanceAlertState.set(response.maintenanceAlert);
          this.busyState.set(false);
          this.toasts.show('Vehículo y conductor asignados exitosamente.');
          if (response.maintenanceAlert === 'DUE_SOON') {
            this.toasts.show(
              'Alerta: La unidad seleccionada tiene mantenimiento próximo (DUE_SOON).',
              'danger',
            );
          }
        },
        error: (error: unknown) => {
          this.busyState.set(false);
          const message = problemMessage(
            error,
            'No se pudo asignar el viaje. Verifique los datos e intente nuevamente.',
          );
          this.actionErrorState.set(message);

          if (message.toLowerCase().includes('mantenimiento vencido')) {
            this.overdueRequiresConfirmationState.set(true);
          }
        },
      });
  }
}
