import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatDate, formatDateTime } from '@shared/formatters/formatters';
import { FilterBar } from '@shared/ui/filter-bar/filter-bar';
import { StatePanel } from '@shared/ui/state-panel/state-panel';
import { StatusBadge } from '@shared/ui/status-badge/status-badge';
import { UiButton } from '@shared/ui/ui-button/ui-button';
import {
  HistoryBadgeTone,
  MAINTENANCE_STATE_LABELS,
  VEHICLE_STATUS_LABELS,
  Vehicle,
  VehicleHealthStatus,
  VehicleHistory,
  VehicleHistoryFilters,
  VehicleHistoryItem,
  VehicleHistoryUnavailableSource,
  formatHistoryStatus,
  formatHistoryTitle,
  formatUnavailableSourcesNotice,
  historyStatusTone,
} from '../../models/fleet.models';

/** Ficha detallada de la unidad vehicular con salud técnica e historial unificado. */
@Component({
  selector: 'app-vehicle-detail-modal',
  imports: [DatePipe, DecimalPipe, RouterLink, FilterBar, StatePanel, StatusBadge, UiButton],
  templateUrl: './vehicle-detail-modal.html',
  styleUrl: './vehicle-detail-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehicleDetailModal {
  readonly vehicle = input<Vehicle | null>(null);
  readonly health = input<VehicleHealthStatus | null>(null);
  readonly healthLoading = input(false);
  readonly healthError = input<string | null>(null);

  readonly history = input<VehicleHistory | null>(null);
  readonly historyState = input<'idle' | 'loading' | 'ready' | 'error'>('idle');
  readonly historyError = input<string | null>(null);
  readonly historyFrom = input('');
  readonly historyTo = input('');

  readonly closeModal = output<void>();
  readonly recordMaintenanceRequested = output<string>();
  readonly historyFiltered = output<VehicleHistoryFilters>();
  readonly historyRangeReset = output<void>();
  readonly historyRetryRequested = output<void>();

  protected readonly statusLabels = VEHICLE_STATUS_LABELS;
  protected readonly maintenanceLabels = MAINTENANCE_STATE_LABELS;

  protected onDateFilterChange(from: string, to: string): void {
    this.historyFiltered.emit({ from, to });
  }

  protected formatItemDate(item: VehicleHistoryItem): string {
    if (item.type === 'MAINTENANCE') {
      // Mantenimiento usa solo el día sin hora para evitar corrimiento en UTC-5.
      return formatDate(item.date.slice(0, 10));
    }
    return formatDateTime(item.date);
  }

  protected formatMaintenanceDate(dateValue: string | null | undefined): string {
    return formatDate(dateValue, 'No programada');
  }

  protected formatTitle(item: VehicleHistoryItem): string {
    return formatHistoryTitle(item);
  }

  protected formatStatus(status: string | null): string | null {
    return formatHistoryStatus(status);
  }

  protected statusTone(status: string | null): HistoryBadgeTone {
    return historyStatusTone(status);
  }

  protected unavailableNotice(sources: readonly VehicleHistoryUnavailableSource[]): string {
    return formatUnavailableSourcesNotice(sources);
  }
}
