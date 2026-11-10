/** Estados operativos posibles para un vehículo en la flota. */
export type VehicleStatus = 'AVAILABLE' | 'IN_TRIP' | 'IN_MAINTENANCE' | 'MAINTENANCE' | string;

/** Estados de mantenimiento preventivo de una unidad. */
export type MaintenanceState = 'UP_TO_DATE' | 'DUE_SOON' | 'OVERDUE' | string;

/** Entidad de vehículo devuelta por la API de Flota. */
export interface Vehicle {
  readonly id: string;
  readonly plateNumber: string;
  readonly brand: string;
  readonly model: string;
  readonly modelYear: number;
  readonly payloadCapacityKg: number;
  readonly status: VehicleStatus;
  readonly createdAt: string;
}

/** Carga útil para dar de alta un vehículo en la empresa. */
export interface CreateVehiclePayload {
  readonly plateNumber: string;
  readonly brand: string;
  readonly model: string;
  readonly modelYear: number;
  readonly payloadCapacityKg: number;
}

/** Estado de salud y mantenimiento de la unidad vehicular. */
export interface VehicleHealthStatus {
  readonly vehicleId: string;
  readonly plateNumber: string;
  readonly vehicleStatus: string;
  readonly maintenanceState: MaintenanceState;
  readonly nextMaintenanceDate: string | null;
  readonly availableForTrip: boolean;
}

/** Etiquetas amigables para el estado operativo del vehículo. */
export const VEHICLE_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponible',
  IN_TRIP: 'En Viaje',
  IN_MAINTENANCE: 'En Mantenimiento',
  MAINTENANCE: 'En Mantenimiento',
};

/** Etiquetas amigables para el estado del mantenimiento preventivo. */
export const MAINTENANCE_STATE_LABELS: Record<string, string> = {
  UP_TO_DATE: 'Al Día',
  DUE_SOON: 'Mantenimiento Próximo',
  OVERDUE: 'Mantenimiento Vencido',
};
