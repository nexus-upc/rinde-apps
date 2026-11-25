const PEN_FORMATTER = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
});

const DATE_FORMATTER = new Intl.DateTimeFormat('es-PE', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'America/Lima',
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Lima',
});

const ISO_DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Formatea un monto numérico en soles peruanos (PEN). */
export function formatPen(value: number | null | undefined, fallback = 'Sin monto'): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return fallback;
  }
  return PEN_FORMATTER.format(value);
}

/** Formatea una fecha ISO o Date usando la configuración regional es-PE. */
export function formatDate(
  value: string | Date | null | undefined,
  fallback = 'Sin fecha',
): string {
  const parsed = parseDateValue(value);
  return parsed ? DATE_FORMATTER.format(parsed) : fallback;
}

/** Formatea una fecha con hora usando la configuración regional es-PE. */
export function formatDateTime(
  value: string | Date | null | undefined,
  fallback = 'Sin fecha',
): string {
  const parsed = parseDateValue(value);
  return parsed ? DATE_TIME_FORMATTER.format(parsed) : fallback;
}

function parseDateValue(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Evita desplazamiento de un día al interpretar fechas YYYY-MM-DD sin hora en UTC-5.
  const dateOnly = ISO_DATE_ONLY.exec(trimmed);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]) - 1;
    const day = Number(dateOnly[3]);
    return new Date(Date.UTC(year, month, day, 12, 0, 0));
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
