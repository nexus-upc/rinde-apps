import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TRIP_STATUS_LABELS, TripSummary } from '../../models/trip.models';

/** Lista de viajes: recibe filas y emite el id del viaje seleccionado. */
@Component({
  selector: 'app-trip-list',
  templateUrl: './trip-list.html',
  styleUrl: './trip-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TripList {
  readonly trips = input.required<readonly TripSummary[]>();
  readonly tripSelected = output<string>();
  protected readonly statusLabels = TRIP_STATUS_LABELS;
}
