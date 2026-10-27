const currency = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });
const date = new Intl.DateTimeFormat('es-PE', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'America/Lima',
});
export const formatMoney = (value: number): string => currency.format(value);
export const formatDate = (value: string | null): string =>
  value ? date.format(new Date(value)) : 'Aún sin vigencia';
