export type DeliveryMethod = 'CASH' | 'TRANSFER';

export type SettlementStatus = 'OPEN' | 'CLOSED';

export type SettlementTripStatus =
  | 'SCHEDULED'
  | 'ASSIGNED'
  | 'IN_ROUTE'
  | 'FINISHED'
  | 'SETTLED';

export const DELIVERY_METHOD_LABELS: Readonly<Record<DeliveryMethod, string>> = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
};

export const SETTLEMENT_STATUS_LABELS: Readonly<Record<SettlementStatus, string>> = {
  OPEN: 'Abierta',
  CLOSED: 'Cerrada',
};

export const TRIP_STATUS_LABELS: Readonly<Record<SettlementTripStatus, string>> = {
  SCHEDULED: 'Programado',
  ASSIGNED: 'Asignado',
  IN_ROUTE: 'En ruta',
  FINISHED: 'Finalizado',
  SETTLED: 'Liquidado',
};

export interface SettlementTripOption {
  readonly id: string;
  readonly code: string;
  readonly origin: string;
  readonly destination: string;
  readonly departureDate: string;
  readonly status: SettlementTripStatus;
}

export interface CreateAdvancePayload {
  readonly amount: number;
  readonly currency?: string;
  readonly deliveryMethod: DeliveryMethod;
}

export interface TripAdvance {
  readonly id: string;
  readonly tripId: string;
  readonly amount: number;
  readonly currency: string;
  readonly deliveryMethod: DeliveryMethod;
  readonly registeredBy: string;
  readonly registeredAt: string;
}

export interface Settlement {
  readonly id: string;
  readonly tenantId: string;
  readonly tripId: string;
  readonly driverId: string;
  readonly status: SettlementStatus;
  readonly advanceAmount: number;
  readonly advanceCurrency: string;
  readonly expenseTotalAmount: number;
  readonly expenseTotalCurrency: string;
  readonly advanceBalance: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly pendingExpenseCount?: number;
}

export interface SettlementExpenseStatusItem {
  readonly id: string;
  readonly status: string;
}
