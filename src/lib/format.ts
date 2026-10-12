const locale = 'en-US';

export function formatCount(value: number) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatKilowatts(value: number) {
  return `${formatCount(value)} kW`;
}

/** 1,284 → "1.3K", 4,200,000 → "4.2M". For stat tiles and axis ticks. */
export function formatCompact(value: number) {
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function formatCurrency(value: number, currency = 'USD') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

export function formatDecimal(value: number, digits = 1) {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

/** Units the charts and tables agree on. Add here, never inline a suffix in a component. */
export type Unit = 'kW' | 'kWh' | 'MWh' | 'therms' | 'gal' | 'USD' | 'percent' | 'count' | '°F' | 'score';

const unitSuffix: Partial<Record<Unit, string>> = {
  kW: ' kW',
  kWh: ' kWh',
  MWh: ' MWh',
  therms: ' therms',
  gal: ' gal',
  '°F': '°F',
};

/** Formats a value with its unit for tooltips, tables, and labels. */
export function formatUnit(value: number, unit: Unit, options: { compact?: boolean } = {}) {
  if (unit === 'USD') return options.compact ? `$${formatCompact(value)}` : formatCurrency(value);
  if (unit === 'percent') return formatPercent(value);
  const number = options.compact ? formatCompact(value) : Number.isInteger(value) ? formatCount(value) : formatDecimal(value);
  return `${number}${unitSuffix[unit] ?? ''}`;
}

/** Signed delta against a named period: "+5.6%" or "−12 kW". */
export function formatDelta(value: number, unit: Unit = 'percent') {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${formatUnit(Math.abs(value), unit)}`;
}
