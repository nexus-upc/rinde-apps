export type ChartTone =
  | 'primary'
  | 'brand-start'
  | 'brand-end'
  | 'success'
  | 'wait'
  | 'muted'
  | 'subtle'
  | 'danger';

export interface ChartDatum {
  readonly label: string;
  readonly value: number;
  readonly formattedValue?: string;
  readonly tone?: ChartTone;
}

const SERIES_TOKEN_ORDER: readonly string[] = [
  'var(--arc-fill)',
  'var(--arc-brand-end)',
  'var(--arc-brand-start)',
  'var(--arc-success)',
  'var(--arc-muted)',
  'var(--arc-subtle)',
];

const TONE_TOKENS: Readonly<Record<ChartTone, string>> = {
  primary: 'var(--arc-fill)',
  'brand-start': 'var(--arc-brand-start)',
  'brand-end': 'var(--arc-brand-end)',
  success: 'var(--arc-success)',
  wait: 'var(--arc-wait)',
  muted: 'var(--arc-muted)',
  subtle: 'var(--arc-subtle)',
  danger: 'var(--arc-danger)',
};

/** Resuelve el token CSS correspondiente a una serie o tono explícito. */
export function resolveChartToken(tone: ChartTone | undefined, index: number): string {
  if (tone) {
    return TONE_TOKENS[tone];
  }
  return SERIES_TOKEN_ORDER[index % SERIES_TOKEN_ORDER.length] ?? 'var(--arc-fill)';
}
