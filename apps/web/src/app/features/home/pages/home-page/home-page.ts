import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StatePanel } from '@shared/ui/state-panel/state-panel';
import { TripStatus, TripSummary } from '../../models/home.models';
import { HomeStore } from '../../state/home.store';

const STATUS_LABELS: Record<TripStatus, string> = {
  SCHEDULED: 'Programado',
  ASSIGNED: 'Asignado',
  IN_ROUTE: 'En ruta',
  FINISHED: 'Finalizado',
  SETTLED: 'Liquidado',
};

const dayFormat = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short' });
const longFormat = new Intl.DateTimeFormat('es-PE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

/** Inicio de la empresa: lo que está en ruta, lo que sale y la semana, sobre el tablero de viajes. */
@Component({
  selector: 'app-home-page',
  providers: [HomeStore],
  imports: [RouterLink, StatePanel],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  protected readonly store = inject(HomeStore);
  protected readonly greeting = greetingFor(new Date().getHours());
  protected readonly todayLabel = capitalize(longFormat.format(new Date()));
  protected readonly weekPeak = computed(() =>
    Math.max(1, ...this.store.week().map((day) => day.count)),
  );
  protected readonly weekRangeLabel = computed(() => {
    const { from, to } = this.store.weekRange();
    return `${dayLabel(from)} a ${dayLabel(to)}`;
  });

  protected readonly inRouteLabel = computed(() => {
    const count = this.store.inRoute().length;
    if (count === 0) return 'Ningún viaje en camino';
    return count === 1 ? '1 viaje en camino' : `${count} viajes en camino`;
  });
  protected readonly assignmentLabel = computed(() => {
    const count = this.store.unassigned().length;
    if (count === 0) return 'Todas las salidas programadas tienen unidad y conductor.';
    return count === 1
      ? '1 salida espera unidad y conductor.'
      : `${count} salidas esperan unidad y conductor.`;
  });

  constructor() {
    this.store.load();
  }

  protected countLabel(count: number): string {
    return count === 1 ? '1 viaje' : `${count} viajes`;
  }

  protected route(trip: TripSummary): string {
    return `${trip.origin} a ${trip.destination}`;
  }

  protected status(trip: TripSummary): string {
    return STATUS_LABELS[trip.status];
  }

  protected day(trip: TripSummary): string {
    return trip.departureDate === this.store.today() ? 'hoy' : dayLabel(trip.departureDate);
  }

  protected unit(trip: TripSummary): string {
    if (trip.vehicleId && trip.driverId) return 'Unidad y conductor asignados';
    return trip.vehicleId || trip.driverId ? 'Asignación incompleta' : 'Sin asignar';
  }
}

function dayLabel(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return dayFormat.format(new Date(year ?? 0, (month ?? 1) - 1, day ?? 1)).replace('.', '');
}

function greetingFor(hour: number): string {
  if (hour < 12) return 'Buenos días';
  return hour < 19 ? 'Buenas tardes' : 'Buenas noches';
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
