import { NotificationPage, UnreadNotificationCount } from '../models/notification.models';

export const NOTIFICATION_PAGE_FIXTURE: NotificationPage = {
  items: [
    {
      id: 'a1b2c3d4-1111-4222-8333-444455556666',
      type: 'EXPENSE_PENDING_REVIEW',
      title: 'Gasto pendiente de revisión',
      message: 'Se registró un gasto por PEN 180.50 para revisar.',
      link: '/expenses?tripId=87460614-42ea-4cd5-9de1-8f38d9496434',
      createdAt: '2026-11-25T14:00:00Z',
      readAt: null,
    },
    {
      id: 'b2c3d4e5-2222-4333-8444-555566667777',
      type: 'SETTLEMENT_READY',
      title: 'Liquidación lista para cierre',
      message: 'El viaje TRP-000014 finalizó y puede liquidarse.',
      link: '/trips/7b0e4f52-1c9a-4f3e-8d21-5a6c9e0b3d44',
      createdAt: '2026-11-24T18:10:00Z',
      readAt: '2026-11-24T19:00:00Z',
    },
    {
      id: 'c3d4e5f6-3333-4444-8555-666677778888',
      type: 'INCIDENT_REPORTED',
      title: 'Incidencia reportada en ruta',
      message: 'Se reportó demora en peaje Ancón en la unidad ABC-123.',
      link: '/incidents/9d1e2f3a-4b5c-4d6e-8f70-112233445566',
      createdAt: '2026-11-25T13:20:00Z',
      readAt: null,
    },
  ],
  page: 0,
  size: 20,
  totalItems: 3,
  totalPages: 1,
};

export const NOTIFICATION_EMPTY_PAGE_FIXTURE: NotificationPage = {
  items: [],
  page: 0,
  size: 20,
  totalItems: 0,
  totalPages: 0,
};

export const UNREAD_NOTIFICATION_COUNT_FIXTURE: UnreadNotificationCount = {
  count: 3,
};
