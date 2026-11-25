import { ExpensePage } from '../models/expense.models';

export const EXPENSE_PAGE_FIXTURE: ExpensePage = {
  items: [
    {
      id: '3c589391-d520-4d01-838a-1a574c7d2bb6',
      tenantId: 'd011f0a2-2b6f-4d32-9cb4-fa6d7cb81698',
      tripId: '87460614-42ea-4cd5-9de1-8f38d9496434',
      driverId: '764a4968-403f-40d7-9172-ba637d10fb16',
      category: 'FUEL',
      amount: 180.5,
      currency: 'PEN',
      expenseDate: '2026-11-20',
      status: 'REGISTERED',
      idempotencyKey: 'EXP-9831-UUID-01',
      observationReason: null,
      isLocked: false,
      evidence: {
        id: '7d1c2f0e-3b8a-4d55-9a61-2e0f4c1b9a10',
        fileName: 'recibo-combustible.jpg',
        contentType: 'image/jpeg',
        fileSizeBytes: 204800,
        sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        contentUrl:
          '/api/v1/expenses/3c589391-d520-4d01-838a-1a574c7d2bb6/evidences/7d1c2f0e-3b8a-4d55-9a61-2e0f4c1b9a10/content',
        uploadedAt: '2026-11-20T14:05:00Z',
      },
      createdAt: '2026-11-20T14:00:00Z',
      updatedAt: '2026-11-20T14:05:00Z',
    },
  ],
  page: 0,
  size: 20,
  totalItems: 1,
  totalPages: 1,
};
