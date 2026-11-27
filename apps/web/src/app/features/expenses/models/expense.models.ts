import { PageResponse } from '@core/http/page.models';

export type ExpenseStatus =
  | 'REGISTERED'
  | 'PENDING_SUPPORT'
  | 'APPROVED'
  | 'OBSERVED'
  | 'LOCKED';

export type ExpenseTrayStatus = 'REGISTERED' | 'PENDING_SUPPORT' | 'APPROVED' | 'OBSERVED';

export type ExpenseStatusFilterValue =
  | ''
  | 'REGISTERED,PENDING_SUPPORT'
  | ExpenseTrayStatus;

export const EXPENSE_STATUS_FILTER_OPTIONS: ReadonlyArray<{
  readonly value: ExpenseStatusFilterValue;
  readonly label: string;
}> = [
  { value: '', label: 'Todos' },
  { value: 'REGISTERED,PENDING_SUPPORT', label: 'Por revisar' },
  { value: 'REGISTERED', label: 'Registrado' },
  { value: 'PENDING_SUPPORT', label: 'Pendiente de soporte' },
  { value: 'APPROVED', label: 'Aprobado' },
  { value: 'OBSERVED', label: 'Observado' },
];

export const EXPENSE_CONTENT_TYPE_LABELS: Readonly<Record<string, string>> = {
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WEBP',
  'application/pdf': 'PDF',
};

export type ExpenseCategory =
  | 'FUEL'
  | 'TOLL'
  | 'FOOD'
  | 'LODGING'
  | 'MAINTENANCE'
  | 'OTHER';

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  REGISTERED: 'Registrado',
  PENDING_SUPPORT: 'Pendiente de soporte',
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

/** Estado de la descarga del archivo de un comprobante. */
export type EvidenceLoadState = 'idle' | 'loading' | 'ready' | 'error';

export interface Evidence {
  readonly id: string;
  readonly fileName: string;
  readonly contentType: string;
  readonly fileSizeBytes: number;
  readonly sha256?: string;
  /** Ruta autenticada del archivo; null en comprobantes anteriores al almacenamiento. */
  readonly contentUrl: string | null;
  readonly uploadedAt: string;
}

/** Gasto devuelto por Expense; driverId es el userId de IAM (cruzar con DriverResource.userId). */
export interface Expense {
  readonly id: string;
  readonly tenantId: string;
  readonly tripId: string;
  readonly driverId: string;
  readonly category: ExpenseCategory;
  readonly amount: number;
  readonly currency: string;
  readonly expenseDate: string;
  readonly status: ExpenseStatus;
  readonly idempotencyKey?: string | null;
  readonly observationReason?: string | null;
  readonly isLocked?: boolean;
  readonly evidence?: Evidence | null;
  readonly createdAt: string;
  readonly updatedAt?: string;
}

export interface ExpenseTrayFilters {
  readonly status?: readonly ExpenseTrayStatus[] | ExpenseTrayStatus;
  readonly tripId?: string;
  readonly driverId?: string;
  readonly from?: string;
  readonly to?: string;
  readonly page?: number;
  readonly size?: number;
}

export type ExpensePage = PageResponse<Expense>;

export interface UpdateExpenseStatusPayload {
  status: 'APPROVED' | 'OBSERVED';
  reason?: string | null;
}

export interface ExpenseCurrencyTotal {
  readonly currency: string;
  readonly amount: number;
}

export interface ExpenseTripSummaryData {
  readonly totalCount: number;
  readonly registeredCount: number;
  readonly pendingSupportCount: number;
  readonly approvedCount: number;
  readonly observedCount: number;
  readonly approvedTotals: readonly ExpenseCurrencyTotal[];
}

/** Resumen mínimo de viaje devuelto por GET /api/v1/trips para enriquecer la bandeja. */
export interface ExpenseTripLookup {
  readonly id: string;
  readonly code: string;
  readonly origin: string;
  readonly destination: string;
}

/** Resumen mínimo de conductor devuelto por GET /api/v1/drivers; userId cruza con Expense.driverId. */
export interface ExpenseDriverLookup {
  readonly id: string;
  readonly userId: string | null;
  readonly fullName: string;
}
