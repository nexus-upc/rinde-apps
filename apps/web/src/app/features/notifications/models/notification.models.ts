import { PageResponse } from '@core/http/page.models';

export type NotificationType =
  'EXPENSE_PENDING_REVIEW' | 'MAINTENANCE_DUE' | 'INCIDENT_REPORTED' | 'SETTLEMENT_READY';

export interface NotificationItem {
  readonly id: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly link: string;
  readonly createdAt: string;
  readonly readAt: string | null;
}

export interface NotificationFilters {
  readonly unreadOnly?: boolean;
  readonly type?: readonly NotificationType[];
  readonly page?: number;
  readonly size?: number;
}

export interface UnreadNotificationCount {
  readonly count: number;
}

export type NotificationPage = PageResponse<NotificationItem>;

/** Tamaño de página que pide la web (el contrato admite de 1 a 100). */
export const NOTIFICATION_PAGE_SIZE = 20;

export const NOTIFICATION_TYPES: readonly NotificationType[] = [
  'EXPENSE_PENDING_REVIEW',
  'MAINTENANCE_DUE',
  'INCIDENT_REPORTED',
  'SETTLEMENT_READY',
];

/** Etiquetas en español por tipo, tal como las fija el contrato C6. */
export const NOTIFICATION_TYPE_LABELS: Readonly<Record<NotificationType, string>> = {
  EXPENSE_PENDING_REVIEW: 'Gastos por revisar',
  MAINTENANCE_DUE: 'Mantenimiento',
  INCIDENT_REPORTED: 'Incidencias',
  SETTLEMENT_READY: 'Viajes por liquidar',
};

/** Texto del enlace que lleva al aviso, según el mockup aprobado. */
export const NOTIFICATION_ACTION_LABELS: Readonly<Record<NotificationType, string>> = {
  EXPENSE_PENDING_REVIEW: 'Revisar gastos del viaje',
  MAINTENANCE_DUE: 'Ver vehículo',
  INCIDENT_REPORTED: 'Ver incidencia',
  SETTLEMENT_READY: 'Ver viaje',
};

/** Fecha corta en español para la lista, p. ej. "25 nov 2026, 14:00". */
export function formatNotificationDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
