import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { RequestAction } from '@core/async/request-action';
import { ToastService } from '@core/feedback/toast.service';
import { DriversApi } from '../data-access/drivers-api';
import {
  CreateDriverPayload,
  Driver,
  DriverEligibility,
  DriverUserAccount,
} from '../models/driver.models';

/** Gestión de estado para el módulo de Conductores: listado, alta y selector de cuentas DRIVER. */
@Injectable()
export class DriversStore {
  private readonly api = inject(DriversApi);
  private readonly toasts = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly loadAction = new RequestAction(this.destroyRef);
  readonly createAction = new RequestAction(this.destroyRef);
  private readonly accountsAction = new RequestAction(this.destroyRef);
  private readonly eligibilityAction = new RequestAction(this.destroyRef);

  private readonly driversState = signal<readonly Driver[]>([]);
  private readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  private readonly creatingState = signal(false);

  private readonly accountsState = signal<readonly DriverUserAccount[]>([]);

  private readonly selectedDriverState = signal<Driver | null>(null);
  private readonly selectedEligibilityState = signal<DriverEligibility | null>(null);
  private readonly eligibilityState = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');

  readonly drivers = this.driversState.asReadonly();
  readonly state = this.loadState.asReadonly();
  readonly error = this.loadAction.error;
  readonly creating = this.creatingState.asReadonly();

  readonly selectedDriver = this.selectedDriverState.asReadonly();
  readonly selectedEligibility = this.selectedEligibilityState.asReadonly();
  readonly eligibilityLoadState = this.eligibilityState.asReadonly();
  readonly eligibilityError = this.eligibilityAction.error;

  /** Solo expone cuentas con rol DRIVER en estado ACTIVE para el selector reactivo. */
  readonly activeAccounts = computed(() =>
    this.accountsState().filter((account) => account.status === 'ACTIVE'),
  );

  readonly countLabel = computed(() => {
    const len = this.driversState().length;
    return len === 1 ? '1 conductor' : `${len} conductores`;
  });

  load(): void {
    this.loadState.set('loading');
    this.loadAction.run(this.api.getDrivers(), {
      onSuccess: (drivers) => {
        this.driversState.set(drivers);
        this.loadState.set('ready');
      },
      onError: () => this.loadState.set('error'),
      errorMessage: 'No se pudo cargar la lista de conductores. Intente nuevamente.',
    });
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.accountsAction.run(this.api.getDriverAccounts(), {
      onSuccess: (accounts) => {
        this.accountsState.set(accounts);
      },
      errorMessage: 'No se pudieron consultar las cuentas de conductor.',
    });
  }

  openCreate(): void {
    this.createAction.clearError();
    this.creatingState.set(true);
    this.loadAccounts();
  }

  closeCreate(): void {
    if (!this.createAction.pending()) {
      this.creatingState.set(false);
    }
  }

  createDriver(payload: CreateDriverPayload): void {
    this.createAction.run(this.api.createDriver(payload), {
      onSuccess: (driver) => {
        this.driversState.update((current) => [driver, ...current]);
        this.creatingState.set(false);
        this.toasts.show(`Conductor ${driver.fullName} registrado exitosamente.`);
      },
      errorMessage: 'No se pudo registrar al conductor. Verifique los datos ingresados.',
    });
  }

  openDriverDetail(driver: Driver): void {
    this.selectedDriverState.set(driver);
    this.selectedEligibilityState.set(null);
    this.eligibilityState.set('loading');

    this.eligibilityAction.run(this.api.getEligibility(driver.id), {
      onSuccess: (eligibility) => {
        this.selectedEligibilityState.set(eligibility);
        this.eligibilityState.set('ready');
      },
      onError: () => {
        this.eligibilityState.set('error');
      },
      errorMessage: 'Estado de elegibilidad no disponible.',
    });
  }

  closeDriverDetail(): void {
    this.selectedDriverState.set(null);
    this.selectedEligibilityState.set(null);
    this.eligibilityState.set('idle');
  }
}
