import { HttpErrorResponse } from '@angular/common/http';

const CONNECTION_ERROR = 'No se pudo conectar con el servidor. Intente nuevamente.';

/** Usa el detail del ProblemDetails del backend; sin él, el mensaje general que se indique. */
export function problemMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }
  const detail = (error.error as { detail?: unknown } | null)?.detail;
  if (typeof detail === 'string' && detail.trim() !== '') {
    return detail;
  }
  return error.status === 0 ? CONNECTION_ERROR : fallback;
}
