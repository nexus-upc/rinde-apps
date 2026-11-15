import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import {
  INCIDENT_STATUS_LABELS,
  INCIDENT_TYPE_LABELS,
  Incident,
  IncidentStatus,
  IncidentType,
} from '../../models/incident.models';

/** Modal de detalle de incidencia con evidencia, transición a atención y datos de cierre (US30 y US31). */
@Component({
  selector: 'app-incident-detail-modal',
  imports: [DatePipe, UiButton],
  templateUrl: './incident-detail-modal.html',
  styleUrl: './incident-detail-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentDetailModal {
  readonly incident = input<Incident | null>(null);
  readonly tripLabels = input<Readonly<Record<string, string>>>({});
  readonly vehicleLabels = input<Readonly<Record<string, string>>>({});
  readonly busy = input(false);
  readonly error = input<string | null>(null);

  readonly closeModal = output<void>();
  readonly moveToInProgress = output<string>();
  readonly requestClose = output<Incident>();

  protected statusLabel(status: IncidentStatus): string {
    return INCIDENT_STATUS_LABELS[status] ?? status;
  }

  protected typeLabel(type: IncidentType): string {
    return INCIDENT_TYPE_LABELS[type] ?? type;
  }

  protected tripDisplay(tripId: string): string {
    return this.tripLabels()[tripId] ?? tripId;
  }

  protected vehicleDisplay(vehicleId: string): string {
    return this.vehicleLabels()[vehicleId] ?? vehicleId;
  }

  protected isSafeUrl(url: string | null): boolean {
    if (!url) return false;
    return /^https?:\/\//i.test(url.trim()) || url.trim().startsWith('/');
  }
}
