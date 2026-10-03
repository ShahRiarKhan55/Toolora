import { parseDecimal } from '../../lib/parseDecimal';

/** The maximum GPA of each supported scale. */
export const GPA_SCALES = [
  { max: 4, label: '4.0 scale' },
  { max: 5, label: '5.0 scale' },
  { max: 10, label: '10-point scale' },
] as const;

export type GpaConversionError = 'empty' | 'not-a-number' | 'out-of-range' | 'unknown-scale';

export type ConversionOutcome =
  { ok: true; value: number } | { ok: false; error: GpaConversionError; message: string };

const round2 = (n: number) => Math.round(n * 100) / 100;

function check(
  input: string,
  upperBound: number,
  unit: string,
  scaleMax: number,
): ConversionOutcome | number {
  if (!GPA_SCALES.some((scale) => scale.max === scaleMax)) {
    return { ok: false, error: 'unknown-scale', message: 'Choose one of the listed GPA scales.' };
  }
  if (input.trim() === '') {
    return { ok: false, error: 'empty', message: `Enter a ${unit}.` };
  }
  const value = parseDecimal(input);
  if (value === undefined) {
    return { ok: false, error: 'not-a-number', message: `Enter the ${unit} as a number.` };
  }
  if (value < 0 || value > upperBound) {
    return {
      ok: false,
      error: 'out-of-range',
      message: `The ${unit} must be between 0 and ${upperBound}.`,
    };
  }
  return value;
}

/**
 * Toolora's formula: a straight proportion, `percentage = GPA ÷ scale maximum × 100`, rounded to two
 * decimals. It is a transparent estimate, not an official conversion — institutions and countries use
 * their own tables, and many are not linear.
 */
export function gpaToPercentage(gpaInput: string, scaleMax: number): ConversionOutcome {
  const gpa = check(gpaInput, scaleMax, 'GPA', scaleMax);
  if (typeof gpa !== 'number') return gpa;
  return { ok: true, value: round2((gpa / scaleMax) * 100) };
}

/** The inverse of `gpaToPercentage`: `GPA = percentage ÷ 100 × scale maximum`, rounded to two decimals. */
export function percentageToGpa(percentageInput: string, scaleMax: number): ConversionOutcome {
  const percentage = check(percentageInput, 100, 'percentage', scaleMax);
  if (typeof percentage !== 'number') return percentage;
  return { ok: true, value: round2((percentage / 100) * scaleMax) };
}
