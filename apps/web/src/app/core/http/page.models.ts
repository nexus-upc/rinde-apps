/** Estructura de página devuelta por los listados paginados en base cero. */
export interface PageResponse<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly size: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

/** Identificadores de origen en respuestas consolidadas parciales. */
export type UnavailableSource = 'TRIP' | 'FLEET' | 'EXPENSE' | 'SETTLEMENT' | 'INCIDENT' | 'IAM';
