import { MAX_CURRENCY_AMOUNT } from '@toolora/shared';
import { parseDecimal } from '../../lib/parseDecimal';

export const COMPOUNDING_OPTIONS = [
  { id: 'yearly', label: 'Yearly', perYear: 1 },
  { id: 'half-yearly', label: 'Half-yearly', perYear: 2 },
  { id: 'quarterly', label: 'Quarterly', perYear: 4 },
  { id: 'monthly', label: 'Monthly', perYear: 12 },
  { id: 'daily', label: 'Daily (365 a year)', perYear: 365 },
] as const;

export type CompoundingId = (typeof COMPOUNDING_OPTIONS)[number]['id'];
export type TimeUnit = 'years' | 'months';

export const MAX_RATE_PERCENT = 100;
export const MAX_YEARS = 100;

export type CompoundInterestError =
  'invalid-principal' | 'principal-too-large' | 'invalid-rate' | 'invalid-time' | 'time-too-long';

export const COMPOUND_INTEREST_ERROR_MESSAGES: Record<CompoundInterestError, string> = {
  'invalid-principal': 'Enter a principal greater than 0.',
  'principal-too-large': 'That principal is too large to calculate.',
  'invalid-rate': `Enter an annual rate from 0 to ${MAX_RATE_PERCENT}%.`,
  'invalid-time': 'Enter a time period greater than 0.',
  'time-too-long': `Use a time period of ${MAX_YEARS} years or less.`,
};

export interface CompoundInterestInput {
  principal: string;
  ratePercent: string;
  compounding: CompoundingId;
  time: string;
  timeUnit: TimeUnit;
}

export interface CompoundInterestResult {
  principal: number;
  finalAmount: number;
  totalInterest: number;
}

/** A = P × (1 + r/n)^(n·t): r the annual rate as a fraction, n compounding periods a year, t years. */
export function calculateCompoundInterest(
  input: CompoundInterestInput,
): { ok: true; value: CompoundInterestResult } | { ok: false; error: CompoundInterestError } {
  const principal = parseDecimal(input.principal);
  if (principal === undefined || principal <= 0) return { ok: false, error: 'invalid-principal' };
  if (principal > MAX_CURRENCY_AMOUNT) return { ok: false, error: 'principal-too-large' };

  const ratePercent = parseDecimal(input.ratePercent);
  if (ratePercent === undefined || ratePercent < 0 || ratePercent > MAX_RATE_PERCENT) {
    return { ok: false, error: 'invalid-rate' };
  }

  const time = parseDecimal(input.time);
  if (time === undefined || time <= 0) return { ok: false, error: 'invalid-time' };
  const years = input.timeUnit === 'months' ? time / 12 : time;
  if (years > MAX_YEARS) return { ok: false, error: 'time-too-long' };

  const perYear = COMPOUNDING_OPTIONS.find((o) => o.id === input.compounding)!.perYear;
  const growth = Math.pow(1 + ratePercent / 100 / perYear, perYear * years);
  // Bounded inputs keep this far below Number.MAX_VALUE (at most ~1e42), so it is always finite.
  const finalAmount = principal * growth;

  return {
    ok: true,
    value: { principal, finalAmount, totalInterest: finalAmount - principal },
  };
}
