import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Página protegida provisional del tablero de viajes; el listado llega en la tarea S2-11. */
@Component({
  selector: 'app-trips-placeholder',
  templateUrl: './trips-placeholder.html',
  styleUrl: './trips-placeholder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TripsPlaceholder {}
