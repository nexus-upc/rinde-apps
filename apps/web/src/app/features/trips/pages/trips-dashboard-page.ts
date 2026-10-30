import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatePanel } from '@shared/ui/state-panel/state-panel';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import { CreateTripPayload, TripStatus } from '../models/trip.models';
import { TripsDashboardStore } from '../state/trips-dashboard.store';
import { TripForm } from '../ui/trip-form/trip-form';
import { TripList } from '../ui/trip-list/trip-list';

/** Página de tablero de viajes: listado (US16) y programación (US14). */
@Component({
  selector: 'app-trips-dashboard-page',
  providers: [TripsDashboardStore],
  imports: [PageHeader, StatePanel, UiButton, TripList, TripForm],
  templateUrl: './trips-dashboard-page.html',
  styleUrl: './trips-dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TripsDashboardPage {
  protected readonly store = inject(TripsDashboardStore);
  private readonly router = inject(Router);

  protected readonly showForm = signal(false);

  protected readonly statusOptions: readonly { value: TripStatus; label: string }[] = [
    { value: 'SCHEDULED', label: 'Programado' },
    { value: 'ASSIGNED', label: 'Asignado' },
    { value: 'IN_ROUTE', label: 'En ruta' },
    { value: 'FINISHED', label: 'Finalizado' },
    { value: 'SETTLED', label: 'Liquidado' },
  ];

  constructor() {
    this.store.load();
  }

  protected filterByStatus(status: TripStatus | null): void {
    this.store.filterByStatus(status);
  }

  protected navigateToDetail(id: string): void {
    void this.router.navigate(['/trips', id]);
  }

  protected createTrip(payload: CreateTripPayload): void {
    this.store.create(payload, () => this.showForm.set(false));
  }
}
