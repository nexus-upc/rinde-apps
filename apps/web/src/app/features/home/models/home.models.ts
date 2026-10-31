/** Estados del viaje tal como los devuelve Trip. */
export type TripStatus = 'SCHEDULED' | 'ASSIGNED' | 'IN_ROUTE' | 'FINISHED' | 'SETTLED';

/** Resumen de GET /api/v1/trips; la fecha de salida llega como AAAA-MM-DD. */
export interface TripSummary {
  readonly id: string;
  readonly code: string;
  readonly origin: string;
  readonly destination: string;
  readonly departureDate: string;
  readonly vehicleId: string | null;
  readonly driverId: string | null;
  readonly status: TripStatus;
}

/** Barra de la semana: viajes con salida en ese día. */
export interface WeekDay {
  readonly label: string;
  readonly count: number;
  readonly today: boolean;
  readonly future: boolean;
}

/** Lo que el inicio muestra de una unidad de Fleet. */
export interface FleetVehicle {
  readonly id: string;
  readonly plateNumber: string;
}

/** Lo que el inicio muestra de un conductor de Fleet. */
export interface FleetDriver {
  readonly id: string;
  readonly fullName: string;
}
