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

/** Métricas agregadas del período; devueltas por GET /api/v1/dashboard/metrics?from=&to=. */
export interface DashboardMetrics {
  readonly period: { readonly from: string; readonly to: string };
  readonly totalTrips: number;
  readonly scheduledTrips: number;
  readonly assignedTrips: number;
  readonly inRouteTrips: number;
  readonly finishedTrips: number;
  readonly settledTrips: number;
  readonly totalExpenses: number;
  readonly approvedExpenses: number;
  readonly pendingExpenses: number;
  readonly observedExpenses: number;
  readonly approvedExpenseTotals: Record<string, number>;
  readonly pendingSettlements: number;
  readonly incidents: {
    readonly openCount: number | null;
    readonly source: 'AVAILABLE' | 'UNAVAILABLE';
  };
  readonly partial: boolean;
}
