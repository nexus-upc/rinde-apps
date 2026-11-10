import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { RequestAction } from '@core/async/request-action';
import { ToastService } from '@core/feedback/toast.service';
import { FleetApi } from '../data-access/fleet-api';
import {
  CreateVehiclePayload,
  MaintenanceAlert,
  RecordMaintenancePayload,
  Vehicle,
  VehicleHealthStatus,
} from '../models/fleet.models';

/** Gestión de estado para el módulo de Flota y Mantenimiento (US12, US32 y US34). */
@Injectable()
export class FleetStore {
  private readonly api = inject(FleetApi);
  private readonly toasts = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly loadAction = new RequestAction(this.destroyRef);
  readonly createAction = new RequestAction(this.destroyRef);
  private readonly healthAction = new RequestAction(this.destroyRef);
  private readonly alertsAction = new RequestAction(this.destroyRef);
  readonly recordAction = new RequestAction(this.destroyRef);

  private readonly vehiclesState = signal<readonly Vehicle[]>([]);
  private readonly alertsState = signal<readonly MaintenanceAlert[]>([]);
  private readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  private readonly creatingState = signal(false);
  private readonly recordingMaintenanceState = signal(false);
  private readonly preselectedVehicleIdState = signal<string | null>(null);
  private readonly activeTabState = signal<'vehicles' | 'alerts'>('vehicles');

  private readonly selectedVehicleState = signal<Vehicle | null>(null);
  private readonly selectedHealthState = signal<VehicleHealthStatus | null>(null);
  private readonly healthState = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');

  readonly vehicles = this.vehiclesState.asReadonly();
  readonly alerts = this.alertsState.asReadonly();
  readonly state = this.loadState.asReadonly();
  readonly error = this.loadAction.error;
  readonly creating = this.creatingState.asReadonly();
  readonly recordingMaintenance = this.recordingMaintenanceState.asReadonly();
  readonly preselectedVehicleId = this.preselectedVehicleIdState.asReadonly();
  readonly activeTab = this.activeTabState.asReadonly();

  readonly selectedVehicle = this.selectedVehicleState.asReadonly();
  readonly selectedHealth = this.selectedHealthState.asReadonly();
  readonly healthLoadState = this.healthState.asReadonly();
  readonly healthError = this.healthAction.error;

  readonly countLabel = computed(() => {
    const len = this.vehiclesState().length;
    return len === 1 ? '1 vehículo' : `${len} vehículos`;
  });

  readonly alertsCount = computed(() => this.alertsState().length);

  load(): void {
    this.loadState.set('loading');
    this.loadAction.run(this.api.getVehicles(), {
      onSuccess: (vehicles) => {
        this.vehiclesState.set(vehicles);
        this.loadState.set('ready');
      },
      onError: () => this.loadState.set('error'),
      errorMessage: 'No se pudo cargar la flota de vehículos. Intente nuevamente.',
    });
    this.loadAlerts();
  }

  loadAlerts(): void {
    this.alertsAction.run(this.api.getMaintenanceAlerts(), {
      onSuccess: (alerts) => {
        this.alertsState.set(alerts);
      },
      errorMessage: 'No se pudieron consultar las alertas de mantenimiento.',
    });
  }

  setTab(tab: 'vehicles' | 'alerts'): void {
    this.activeTabState.set(tab);
  }

  openCreate(): void {
    this.createAction.clearError();
    this.creatingState.set(true);
  }

  closeCreate(): void {
    if (!this.createAction.pending()) {
      this.creatingState.set(false);
    }
  }

  createVehicle(payload: CreateVehiclePayload): void {
    this.createAction.run(this.api.createVehicle(payload), {
      onSuccess: (vehicle) => {
        this.vehiclesState.update((current) => [vehicle, ...current]);
        this.creatingState.set(false);
        this.toasts.show(`Vehículo ${vehicle.plateNumber} registrado exitosamente.`);
      },
      errorMessage: 'No se pudo registrar el vehículo. Verifique los datos ingresados.',
    });
  }

  openRecordMaintenance(vehicleId?: string): void {
    this.recordAction.clearError();
    this.preselectedVehicleIdState.set(vehicleId ?? null);
    this.recordingMaintenanceState.set(true);
  }

  closeRecordMaintenance(): void {
    if (!this.recordAction.pending()) {
      this.recordingMaintenanceState.set(false);
      this.preselectedVehicleIdState.set(null);
    }
  }

  recordMaintenance(payload: RecordMaintenancePayload): void {
    this.recordAction.run(this.api.recordMaintenance(payload), {
      onSuccess: () => {
        this.recordingMaintenanceState.set(false);
        this.preselectedVehicleIdState.set(null);
        this.toasts.show('Mantenimiento técnico registrado exitosamente.');
        this.load(); // Actualiza estados de vehículos y alertas
        if (this.selectedVehicleState()?.id === payload.vehicleId) {
          this.openVehicleDetail(this.selectedVehicleState()!);
        }
      },
      errorMessage: 'No se pudo registrar el mantenimiento. Verifique los datos ingresados.',
    });
  }

  openVehicleDetail(vehicle: Vehicle): void {
    this.selectedVehicleState.set(vehicle);
    this.selectedHealthState.set(null);
    this.healthState.set('loading');

    this.healthAction.run(this.api.getVehicleHealth(vehicle.id), {
      onSuccess: (health) => {
        this.selectedHealthState.set(health);
        this.healthState.set('ready');
      },
      onError: () => {
        this.healthState.set('error');
      },
      errorMessage: 'Estado de mantenimiento no disponible.',
    });
  }

  closeVehicleDetail(): void {
    this.selectedVehicleState.set(null);
    this.selectedHealthState.set(null);
    this.healthState.set('idle');
  }
}
