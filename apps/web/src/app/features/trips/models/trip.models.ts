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

export type TripExpenseStatus = 'REGISTERED' | 'PENDING_SUPPORT' | 'APPROVED' | 'OBSERVED';

export type TripSettlementStatus = 'OPEN' | 'CLOSED';

export type TripAdvanceDeliveryMethod = 'CASH' | 'TRANSFER';

export type TripIncidentType = 'BREAKDOWN' | 'DELAY' | 'OTHER';

export type TripIncidentStatus = 'OPEN' | 'IN_PROGRESS';

export type TripSummaryUnavailableSource = 'FLEET' | 'EXPENSE' | 'SETTLEMENT' | 'INCIDENT';

export interface TripExpenseCountsByStatus {
  readonly REGISTERED: number;
  readonly PENDING_SUPPORT: number;
  readonly APPROVED: number;
  readonly OBSERVED: number;
}

export interface TripOpenIncident {
  readonly id: string;
  readonly type: TripIncidentType;
  readonly status: TripIncidentStatus;
  readonly reportedAt: string;
}

/** Resumen consolidado de GET /api/v1/dashboard/trips/{tripId}/summary (contrato C1). */
export interface TripConsolidatedSummary {
  readonly tripId: string;
  readonly code: string;
  readonly status: TripStatus;
  readonly origin: string;
  readonly destination: string;
  readonly cargoDescription: string;
  readonly cargoWeightKg: number | null;
  readonly departureDate: string;
  readonly vehicleId: string | null;
  readonly driverId: string | null;
  readonly startedAt: string | null;
  readonly finishedAt: string | null;
  readonly expenseCount: number;
  readonly expenseTotal: number;
  readonly expenseCurrency: string;
  readonly settlementStatus: TripSettlementStatus | null;
  readonly advanceAmount: number | null;
  readonly advanceBalance: number | null;
  readonly vehiclePlate: string | null;
  readonly driverName: string | null;
  readonly expenseCountsByStatus: TripExpenseCountsByStatus;
  readonly approvedTotal: number;
  readonly pendingReviewCount: number;
  readonly advanceDeliveryMethod: TripAdvanceDeliveryMethod | null;
  readonly settlementId: string | null;
  readonly settlementClosedAt: string | null;
  readonly openIncidents: readonly TripOpenIncident[];
  readonly partial: boolean;
  readonly unavailableSources: readonly TripSummaryUnavailableSource[];
}
