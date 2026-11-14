import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { StatePanel } from '@shared/ui/state-panel/state-panel';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import {
  INCIDENT_STATUS_LABELS,
  Incident,
  IncidentStatus,
} from '../../models/incident.models';
import { IncidentStore } from '../../state/incident.store';
import { IncidentCloseModal } from '../../ui/incident-close-modal/incident-close-modal';
import { IncidentDetailModal } from '../../ui/incident-detail-modal/incident-detail-modal';
import { IncidentList } from '../../ui/incident-list/incident-list';

/** Pantalla de consulta, atención y cierre de incidencias operativas (US30 y US31). */
@Component({
  selector: 'app-incidents-page',
  providers: [IncidentStore],
  imports: [
    PageHeader,
    StatePanel,
    UiButton,
    IncidentList,
    IncidentDetailModal,
    IncidentCloseModal,
  ],
  templateUrl: './incidents-page.html',
  styleUrl: './incidents-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentsPage implements OnInit {
  protected readonly store = inject(IncidentStore);
  private readonly route = inject(ActivatedRoute);

  protected readonly statusInput = signal<IncidentStatus | ''>('');
  protected readonly tripIdInput = signal('');
  protected readonly vehicleIdInput = signal('');

  protected readonly statusOptions: readonly { value: IncidentStatus | ''; label: string }[] = [
    { value: '', label: 'Todos los estados' },
    { value: 'OPEN', label: INCIDENT_STATUS_LABELS.OPEN },
    { value: 'IN_PROGRESS', label: INCIDENT_STATUS_LABELS.IN_PROGRESS },
    { value: 'CLOSED', label: INCIDENT_STATUS_LABELS.CLOSED },
  ];

  ngOnInit(): void {
    const query = this.route.snapshot.queryParamMap;
    const rawStatus = query?.get('status') ?? '';
    const initialStatus: IncidentStatus | '' =
      rawStatus === 'OPEN' || rawStatus === 'IN_PROGRESS' || rawStatus === 'CLOSED'
        ? rawStatus
        : '';
    const initialTripId = query?.get('tripId') ?? '';
    const initialVehicleId = query?.get('vehicleId') ?? '';

    this.statusInput.set(initialStatus);
    this.tripIdInput.set(initialTripId);
    this.vehicleIdInput.set(initialVehicleId);

    this.store.loadInitial({
      status: initialStatus,
      tripId: initialTripId,
      vehicleId: initialVehicleId,
    });

    const routeIncidentId = this.route.snapshot.paramMap?.get('id');
    if (routeIncidentId) {
      this.store.openDetailById(routeIncidentId);
    }
  }

  protected onStatusSelected(event: Event): void {
    const raw = (event.target as HTMLSelectElement | null)?.value ?? '';
    const nextStatus: IncidentStatus | '' =
      raw === 'OPEN' || raw === 'IN_PROGRESS' || raw === 'CLOSED' ? raw : '';
    this.statusInput.set(nextStatus);
    this.applyFilters();
  }

  protected onTripIdInput(event: Event): void {
    this.tripIdInput.set((event.target as HTMLInputElement | null)?.value ?? '');
  }

  protected onVehicleIdInput(event: Event): void {
    this.vehicleIdInput.set((event.target as HTMLInputElement | null)?.value ?? '');
  }

  protected applyFilters(event?: Event): void {
    event?.preventDefault();
    this.store.applyFilters({
      status: this.statusInput(),
      tripId: this.tripIdInput(),
      vehicleId: this.vehicleIdInput(),
    });
  }

  protected clearFilters(): void {
    this.statusInput.set('');
    this.tripIdInput.set('');
    this.vehicleIdInput.set('');
    this.store.resetFilters();
  }

  protected onSelectIncident(incident: Incident): void {
    this.store.openDetail(incident);
  }
}
