export type TripStatus = 'SCHEDULED' | 'ASSIGNED' | 'IN_ROUTE' | 'FINISHED' | 'SETTLED';

export interface TripStatusChange {
  readonly status: string;
  readonly changedAt: string;
  readonly reason: string | null;
}

export interface TripDetail {
  readonly id: string;
  readonly code: string;
  readonly origin: string;
  readonly destination: string;
  readonly cargoDescription: string;
  readonly cargoWeightKg: number | null;
  readonly departureDate: string;
  readonly status: TripStatus;
  readonly vehicleId: string | null;
  readonly driverId: string | null;
  readonly assignedAt: string | null;
  readonly overdueMaintenanceConfirmedBy: string | null;
  readonly startedAt: string | null;
  readonly finishedAt: string | null;
  readonly statusChanges: readonly TripStatusChange[];
}

export interface VehicleSummary {
  readonly id: string;
  readonly plateNumber: string;
  readonly brand: string;
  readonly model: string;
  readonly modelYear: number;
  readonly payloadCapacityKg: number;
  readonly status: string;
}

export interface DriverSummary {
  readonly id: string;
  readonly userId: string;
  readonly fullName: string;
  readonly documentType: string;
  readonly documentNumber: string;
  readonly licenseNumber: string;
  readonly licenseCategory: string;
  readonly licenseExpirationDate: string;
  readonly status: string;
}

export interface AssignTripPayload {
  readonly vehicleId: string;
  readonly driverId: string;
  readonly confirmOverdueMaintenance: boolean;
}

export interface TripAssignmentResponse {
  readonly id: string;
  readonly code: string;
  readonly status: TripStatus;
  readonly vehicleId: string;
  readonly driverId: string;
  readonly assignedAt: string;
  readonly maintenanceAlert: 'DUE_SOON' | null;
}

export const TRIP_STATUS_LABELS: Readonly<Record<TripStatus, string>> = {
  SCHEDULED: 'Programado',
  ASSIGNED: 'Asignado',
  IN_ROUTE: 'En ruta',
  FINISHED: 'Finalizado',
  SETTLED: 'Liquidado',
};

export interface TripSummary {
  readonly id: string;
  readonly code: string;
  readonly origin: string;
  readonly destination: string;
  readonly departureDate: string;
  readonly status: TripStatus;
  readonly vehicleId: string | null;
  readonly driverId: string | null;
}

export interface TripFilters {
  readonly status?: TripStatus;
}

export interface CreateTripPayload {
  readonly origin: string;
  readonly destination: string;
  readonly cargoDescription: string;
  readonly cargoWeightKg: number | null;
  readonly departureDate: string;
}
