export type ExpenseStatus = 'REGISTERED' | 'APPROVED' | 'OBSERVED' | 'LOCKED';

export type ExpenseCategory =
  | 'FUEL'
  | 'TOLL'
  | 'FOOD'
  | 'LODGING'
  | 'MAINTENANCE'
  | 'OTHER';

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  REGISTERED: 'Registrado',
  APPROVED: 'Aprobado',
  OBSERVED: 'Observado',
  LOCKED: 'Bloqueado',
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  FUEL: 'Combustible',
  TOLL: 'Peaje',
  FOOD: 'Alimentación',
  LODGING: 'Hospedaje',
  MAINTENANCE: 'Mantenimiento',
  OTHER: 'Otros',
};

export interface Evidence {
  id: string;
  imageUrl: string;
  fileSizeBytes: number;
  uploadedAt: string;
}

export interface Expense {
  id: string;
  tenantId: string;
  tripId: string;
  driverId: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  expenseDate: string;
  status: ExpenseStatus;
  idempotencyKey?: string | null;
  observationReason?: string | null;
  isLocked?: boolean;
  evidence?: Evidence | null;
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateExpenseStatusPayload {
  status: 'APPROVED' | 'OBSERVED';
  reason?: string | null;
}
