import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  DriverSummary,
  TRIP_STATUS_LABELS,
  TripDetail,
  VehicleSummary,
} from '../../models/trip.models';

/** Muestra la información operativa, ruta, carga, asignación e historial de estados del viaje. */
@Component({
  selector: 'app-trip-info',
  imports: [DatePipe],
  templateUrl: './trip-info.html',
  styleUrl: './trip-info.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TripInfo {
  readonly trip = input.required<TripDetail>();
  readonly vehicle = input<VehicleSummary | null>(null);
  readonly driver = input<DriverSummary | null>(null);

  readonly statusLabel = computed(
    () => TRIP_STATUS_LABELS[this.trip().status] ?? this.trip().status,
  );
}
