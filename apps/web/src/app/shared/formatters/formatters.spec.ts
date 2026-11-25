import { formatDate, formatDateTime, formatPen } from './formatters';

describe('formatters', () => {
  it('formats PEN currency amounts and falls back on nullish values', () => {
    expect(formatPen(180.5)).toContain('180.50');
    expect(formatPen(0)).toContain('0.00');
    expect(formatPen(null)).toBe('Sin monto');
    expect(formatPen(undefined, 'Por calcular')).toBe('Por calcular');
  });

  it('formats YYYY-MM-DD dates in es-PE without timezone day shift', () => {
    const formatted = formatDate('2026-11-20');
    expect(formatted).toContain('20');
    expect(formatted).toContain('2026');
    expect(formatDate(null)).toBe('Sin fecha');
    expect(formatDate('fecha-invalida')).toBe('Sin fecha');
  });

  it('formats ISO timestamps with date and time in es-PE', () => {
    const formatted = formatDateTime('2026-11-20T18:10:00Z');
    expect(formatted).toContain('20');
    expect(formatted).toContain('2026');
    expect(formatDateTime('')).toBe('Sin fecha');
  });
});
