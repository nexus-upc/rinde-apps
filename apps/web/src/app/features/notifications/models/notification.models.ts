import { PageResponse } from '@core/http/page.models';

export type NotificationType =
  | 'EXPENSE_PENDING_REVIEW'
  | 'MAINTENANCE_DUE'
  | 'INCIDENT_REPORTED'
  | 'SETTLEMENT_READY';

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

export const NOTIFICATION_TYPE_LABELS: Readonly<Record<NotificationType, string>> = {
  EXPENSE_PENDING_REVIEW: 'Gastos por revisar',
  MAINTENANCE_DUE: 'Mantenimiento',
  INCIDENT_REPORTED: 'Incidencias',
  SETTLEMENT_READY: 'Viajes por liquidar',
};
