import { parseDecimal } from '../../lib/parseDecimal';

export const PERCENT_MODES = [
  { id: 'of', label: 'What is X% of Y?' },
  { id: 'what-percent', label: 'X is what percent of Y?' },
  { id: 'change', label: 'Percentage change from X to Y' },
  { id: 'adjust', label: 'Increase or decrease X by Y%' },
] as const;
export type PercentMode = (typeof PERCENT_MODES)[number]['id'];

export type PercentError = 'invalid-x' | 'invalid-y' | 'zero-y' | 'zero-x' | 'too-large';

export const PERCENT_ERROR_MESSAGES: Record<PercentError, string> = {
  'invalid-x': 'Enter a number for the first value.',
  'invalid-y': 'Enter a number for the second value.',
  'zero-y': 'The second value cannot be 0: a percentage of 0 is undefined.',
  'zero-x': 'The starting value cannot be 0: a percentage change from 0 is undefined.',
  'too-large': 'These numbers are too large to calculate.',
};

export interface PercentInput {
  mode: PercentMode;
  x: string;
  y: string;
  /** Only for `adjust`. */
  direction?: 'increase' | 'decrease';
}

export interface PercentResult {
  /** Cleaned of floating-point noise (12 significant digits). */
  value: number;
  kind: 'amount' | 'percent';
  /** For `change`: whether the value rose, fell or stayed the same. */
  trend?: 'increase' | 'decrease' | 'none';
}

export type PercentOutcome =
  { ok: true; value: PercentResult } | { ok: false; error: PercentError };

/** 12 significant digits hides 0.1 + 0.2 style noise while keeping every digit a user can type. */
const clean = (value: number) => Number(value.toPrecision(12));

/**
 * The four everyday percentage questions. Negative and decimal values are allowed where the math is
 * defined; a change from a negative start is measured against its absolute value, so rising from -50
 * to -25 reads as +50%.
 */
export function calculatePercentage({
  mode,
  x,
  y,
  direction = 'increase',
}: PercentInput): PercentOutcome {
  const a = parseDecimal(x);
  const b = parseDecimal(y);
  if (a === undefined) return { ok: false, error: 'invalid-x' };
  if (b === undefined) return { ok: false, error: 'invalid-y' };

  let raw: number;
  let kind: PercentResult['kind'] = 'amount';
  let trend: PercentResult['trend'];
  switch (mode) {
    case 'of':
      raw = (a * b) / 100;
      break;
    case 'what-percent':
      if (b === 0) return { ok: false, error: 'zero-y' };
      raw = (a / b) * 100;
      kind = 'percent';
      break;
    case 'change':
      if (a === 0) return { ok: false, error: 'zero-x' };
      raw = ((b - a) / Math.abs(a)) * 100;
      kind = 'percent';
      trend = raw > 0 ? 'increase' : raw < 0 ? 'decrease' : 'none';
      break;
    case 'adjust':
      raw = a * (1 + (direction === 'decrease' ? -b : b) / 100);
      break;
  }
  if (!Number.isFinite(raw)) return { ok: false, error: 'too-large' };
  // Avoid showing "-0".
  const value = clean(raw) + 0;
  return { ok: true, value: { value, kind, ...(trend ? { trend } : {}) } };
}

/** Display form: thousands separators and up to 6 decimals, never exponent notation for normal sizes. */
export function formatPercentNumber(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 6 });
}
