import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { problemMessage } from '@core/http/problem-message';
import { catchError, forkJoin, of } from 'rxjs';
import { HomeApi } from '../data-access/home-api';
import { TripSummary, WeekDay } from '../models/home.models';

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const PENDING = new Set(['SCHEDULED', 'ASSIGNED']);
const DONE = new Set(['FINISHED', 'SETTLED']);

/** Fecha local en AAAA-MM-DD, el mismo formato de departureDate. */
export function isoDay(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function mondayOf(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - ((date.getDay() + 6) % 7));
}

function byDeparture(trips: readonly TripSummary[]): TripSummary[] {
  return [...trips].sort((a, b) => a.departureDate.localeCompare(b.departureDate));
}

/** Resumen del día calculado sobre el tablero de viajes; vive con la página de inicio. */
@Injectable()
export class HomeStore {
  private readonly api = inject(HomeApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  private readonly errorState = signal('');
  private readonly tripsState = signal<readonly TripSummary[]>([]);
  private readonly platesState = signal<ReadonlyMap<string, string>>(new Map());
  private readonly driversState = signal<ReadonlyMap<string, string>>(new Map());
  private readonly todayState = signal(new Date());
  readonly state = this.loadState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly trips = this.tripsState.asReadonly();

  readonly today = computed(() => isoDay(this.todayState()));
  readonly inRoute = computed(() => this.tripsState().filter((trip) => trip.status === 'IN_ROUTE'));
  /** Salidas pendientes desde hoy, la más próxima primero. */
  readonly upcoming = computed(() =>
    byDeparture(
      this.tripsState().filter(
        (trip) => PENDING.has(trip.status) && trip.departureDate >= this.today(),
      ),
    ),
  );
  readonly nextDeparture = computed(() => this.upcoming()[0] ?? null);
  /** Lo que sale hoy y lo que sigue en ruta; si no hay nada, las próximas salidas. */
  readonly agenda = computed(() => {
    const today = this.today();
    const current = this.tripsState().filter(
      (trip) => trip.departureDate === today || trip.status === 'IN_ROUTE',
    );
    const rows = current.length ? current : this.upcoming();
    return byDeparture(rows).slice(0, 6);
  });
  readonly agendaIsToday = computed(() =>
    this.tripsState().some(
      (trip) => trip.departureDate === this.today() || trip.status === 'IN_ROUTE',
    ),
  );
  readonly unassigned = computed(() =>
    this.upcoming().filter((trip) => trip.status === 'SCHEDULED'),
  );
  readonly week = computed<readonly WeekDay[]>(() => {
    const monday = mondayOf(this.todayState());
    return DAY_LABELS.map((label, index) => {
      const day = isoDay(
        new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index),
      );
      return {
        label: day === this.today() ? 'Hoy' : label,
        count: this.tripsState().filter((trip) => trip.departureDate === day).length,
        today: day === this.today(),
        future: day > this.today(),
      };
    });
  });
  readonly weekRange = computed(() => {
    const monday = mondayOf(this.todayState());
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
    return { from: isoDay(monday), to: isoDay(sunday) };
  });
  readonly weekTotals = computed(() => {
    const { from, to } = this.weekRange();
    const inWeek = this.tripsState().filter(
      (trip) => trip.departureDate >= from && trip.departureDate <= to,
    );
    return {
      finished: inWeek.filter((trip) => DONE.has(trip.status)).length,
      pending: inWeek.filter((trip) => PENDING.has(trip.status)).length,
      inRoute: inWeek.filter((trip) => trip.status === 'IN_ROUTE').length,
    };
  });

  /** Placa y conductor de un viaje, con los nombres de Fleet cuando se pudieron consultar. */
  assignment(trip: TripSummary): string | null {
    if (!trip.vehicleId || !trip.driverId) return null;
    const plate = this.platesState().get(trip.vehicleId);
    const driver = this.driversState().get(trip.driverId);
    return plate && driver ? `${plate}, ${driver}` : 'Unidad y conductor asignados';
  }

  load(): void {
    this.loadState.set('loading');
    this.todayState.set(new Date());
    // Sin Fleet el inicio sigue funcionando: solo deja de mostrar placas y nombres.
    forkJoin({
      trips: this.api.trips(),
      vehicles: this.api.vehicles().pipe(catchError(() => of([]))),
      drivers: this.api.drivers().pipe(catchError(() => of([]))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ trips, vehicles, drivers }) => {
          this.platesState.set(new Map(vehicles.map((item) => [item.id, item.plateNumber])));
          this.driversState.set(new Map(drivers.map((item) => [item.id, item.fullName])));
          this.tripsState.set(trips);
          this.loadState.set('ready');
        },
        error: (error: unknown) => {
          this.errorState.set(problemMessage(error, 'No pudimos cargar los viajes.'));
          this.loadState.set('error');
        },
      });
  }
}
