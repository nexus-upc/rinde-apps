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

/** Entidad de registro de mantenimiento ejecutado. */
export interface Maintenance {
  readonly id: string;
  readonly vehicleId: string;
  readonly maintenanceType: string;
  readonly executionDate: string;
  readonly mileage: number;
  readonly cost: number;
  readonly nextMaintenanceDate: string;
  readonly notes: string | null;
  readonly createdAt: string;
}

/** Carga útil para registrar un mantenimiento técnico. */
export interface RecordMaintenancePayload {
  readonly vehicleId: string;
  readonly maintenanceType: string;
  readonly executionDate: string;
  readonly mileage: number;
  readonly cost: number;
  readonly nextMaintenanceDate: string;
  readonly notes: string | null;
}

/** Alerta de mantenimiento preventivo de una unidad. */
export interface MaintenanceAlert {
  readonly vehicleId: string;
  readonly plateNumber: string;
  readonly state: MaintenanceState;
  readonly nextMaintenanceDate: string;
  readonly message: string;
}

/** Opciones de tipo de mantenimiento técnico. */
export const MAINTENANCE_TYPES = [
  { value: 'PREVENTIVE', label: 'Preventivo' },
  { value: 'CORRECTIVE', label: 'Correctivo' },
  { value: 'PREDICTIVE', label: 'Predictivo' },
] as const;

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

export type VehicleHistoryItemType = 'TRIP' | 'MAINTENANCE' | 'INCIDENT';

export type VehicleHistoryUnavailableSource = 'TRIP' | 'INCIDENT';

export interface VehicleHistoryItem {
  readonly type: VehicleHistoryItemType;
  readonly id: string;
  readonly date: string;
  readonly title: string;
  readonly status: string | null;
  readonly detail: string | null;
}

/** Historial unificado devuelto por GET /api/v1/vehicles/{id}/history (contrato C3). */
export interface VehicleHistory {
  readonly vehicleId: string;
  readonly nextMaintenanceDate: string | null;
  readonly items: readonly VehicleHistoryItem[];
  readonly partial: boolean;
  readonly unavailableSources: readonly VehicleHistoryUnavailableSource[];
}

export interface VehicleHistoryFilters {
  readonly from?: string;
  readonly to?: string;
}

export const VEHICLE_HISTORY_TYPE_LABELS: Readonly<Record<VehicleHistoryItemType, string>> = {
  TRIP: 'Viaje',
  MAINTENANCE: 'Mantenimiento',
  INCIDENT: 'Incidencia',
};

export type HistoryBadgeTone = 'neutral' | 'success' | 'wait' | 'danger';

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  BREAKDOWN: 'avería',
  ACCIDENT: 'accidente',
  DELAY: 'retraso',
  ROUTE_DEVIATION: 'desvío de ruta',
  TRAFFIC: 'tráfico',
  OTHER: 'otra',
};

const MAINTENANCE_LOWER_LABELS: Record<string, string> = {
  PREVENTIVE: 'preventivo',
  CORRECTIVE: 'correctivo',
  PREDICTIVE: 'predictivo',
};

const HISTORY_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Programado',
  ASSIGNED: 'Asignado',
  IN_ROUTE: 'En ruta',
  FINISHED: 'Finalizado',
  CANCELLED: 'Cancelado',
  OPEN: 'Abierta',
  IN_PROGRESS: 'En atención',
  CLOSED: 'Cerrada',
};

const HISTORY_STATUS_TONES: Record<string, HistoryBadgeTone> = {
  SCHEDULED: 'neutral',
  ASSIGNED: 'wait',
  IN_ROUTE: 'wait',
  FINISHED: 'success',
  CANCELLED: 'danger',
  OPEN: 'danger',
  IN_PROGRESS: 'wait',
  CLOSED: 'neutral',
};

/** Traduce el título técnico de un evento del historial a español legible. */
export function formatHistoryTitle(item: VehicleHistoryItem): string {
  if (item.type === 'INCIDENT') {
    const rawType = item.title.replace(/^Incidencia\s+/i, '').trim().toUpperCase();
    const label = INCIDENT_TYPE_LABELS[rawType] ?? rawType.toLowerCase();
    return `Incidencia: ${label}`;
  }
  if (item.type === 'MAINTENANCE') {
    const rawType = item.title.replace(/^Mantenimiento\s+/i, '').trim().toUpperCase();
    const label = MAINTENANCE_LOWER_LABELS[rawType] ?? rawType.toLowerCase();
    return `Mantenimiento ${label}`;
  }
  return item.title;
}

/** Traduce el estado de viaje o incidencia; devuelve null si el evento no tiene estado. */
export function formatHistoryStatus(status: string | null): string | null {
  if (!status) return null;
  return HISTORY_STATUS_LABELS[status] ?? 'Registrado';
}

/** Devuelve el tono visual del badge según el estado del evento. */
export function historyStatusTone(status: string | null): HistoryBadgeTone {
  if (!status) return 'neutral';
  return HISTORY_STATUS_TONES[status] ?? 'neutral';
}

/** Construye un mensaje en español natural cuando faltan fuentes remotas. */
export function formatUnavailableSourcesNotice(
  sources: readonly VehicleHistoryUnavailableSource[],
): string {
  const hasTrip = sources.includes('TRIP');
  const hasIncident = sources.includes('INCIDENT');
  if (hasTrip && hasIncident) {
    return 'Historial parcial: viajes e incidencias no están disponibles en este momento.';
  }
  if (hasTrip) {
    return 'Historial parcial: los viajes no están disponibles en este momento.';
  }
  if (hasIncident) {
    return 'Historial parcial: las incidencias no están disponibles en este momento.';
  }
  return 'Historial parcial: algunas fuentes remotas no respondieron.';
}
