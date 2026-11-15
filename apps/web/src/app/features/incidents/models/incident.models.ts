export type IncidentType = 'BREAKDOWN' | 'DELAY' | 'OTHER';

export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';

export const INCIDENT_TYPE_LABELS: Readonly<Record<IncidentType, string>> = {
  BREAKDOWN: 'Falla mecánica',
  DELAY: 'Demora / Retraso',
  OTHER: 'Otro',
};

export const INCIDENT_STATUS_LABELS: Readonly<Record<IncidentStatus, string>> = {
  OPEN: 'Abierta',
  IN_PROGRESS: 'En atención',
  CLOSED: 'Cerrada',
};

export interface IncidentResolution {
  readonly action: string;
  readonly closedBy: string;
  readonly closedAt: string;
}

export interface Incident {
  readonly id: string;
  readonly tripId: string;
  readonly vehicleId: string;
  readonly reportedBy: string;
  readonly type: IncidentType;
  readonly description: string;
  readonly evidenceUrl: string | null;
  readonly status: IncidentStatus;
  readonly reportedAt: string;
  readonly resolution: IncidentResolution | null;
  readonly updatedAt: string;
}

export interface IncidentFilters {
  readonly status?: IncidentStatus | '';
  readonly tripId?: string;
  readonly vehicleId?: string;
}

export interface UpdateIncidentStatusPayload {
  readonly status: 'IN_PROGRESS';
}

export interface CloseIncidentPayload {
  readonly action: string;
}

export interface IncidentTripOption {
  readonly id: string;
  readonly code: string;
  readonly origin: string;
  readonly destination: string;
}

export interface IncidentVehicleOption {
  readonly id: string;
  readonly plateNumber: string;
  readonly brand: string;
  readonly model: string;
}
