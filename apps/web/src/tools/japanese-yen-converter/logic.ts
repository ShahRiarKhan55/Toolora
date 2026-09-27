import { parseDecimal } from '../../lib/parseDecimal';

export interface CurrencyOption {
  code: string;
  name: string;
  /** Reference units of this currency per ¥1. Editable by the user — not a live market rate. */
  defaultRate: number;
}

// Reference rates only, roughly accurate as of when this list was written. They are NOT live and
// must never be presented as current market rates (CLAUDE.md: "Rules against fake functionality").
export const CURRENCY_OPTIONS: readonly CurrencyOption[] = [
  { code: 'USD', name: 'US Dollar', defaultRate: 0.0067 },
  { code: 'EUR', name: 'Euro', defaultRate: 0.0062 },
  { code: 'GBP', name: 'British Pound', defaultRate: 0.0053 },
  { code: 'AUD', name: 'Australian Dollar', defaultRate: 0.0104 },
  { code: 'CNY', name: 'Chinese Yuan', defaultRate: 0.049 },
  { code: 'KRW', name: 'South Korean Won', defaultRate: 9.35 },
];

export type ConvertYenError =
  'invalid-amount' | 'negative-amount' | 'invalid-rate' | 'negative-rate';

export interface ConvertYenResult {
  amountYen: number;
  ratePerYen: number;
  converted: number;
}

export type ConvertYenOutcome =
  { ok: true; value: ConvertYenResult } | { ok: false; error: ConvertYenError };

export const YEN_CONVERTER_ERROR_MESSAGES: Record<ConvertYenError, string> = {
  'invalid-amount': 'Enter a valid amount in yen (numbers only).',
  'negative-amount': 'The amount in yen cannot be negative.',
  'invalid-rate': 'Enter a valid reference rate (numbers only).',
  'negative-rate': 'The reference rate cannot be negative.',
};

/**
 * Converts a yen amount using a user-supplied reference rate (units of the target currency per
 * ¥1). Structured to take the rate as a plain number rather than looking one up internally, so a
 * later phase can swap in a live-rate provider without changing this function's contract.
 */
export function convertYen(amountYenInput: string, ratePerYenInput: string): ConvertYenOutcome {
  const amountYen = parseDecimal(amountYenInput);
  if (amountYen === undefined) return { ok: false, error: 'invalid-amount' };
  if (amountYen < 0) return { ok: false, error: 'negative-amount' };

  const ratePerYen = parseDecimal(ratePerYenInput);
  if (ratePerYen === undefined) return { ok: false, error: 'invalid-rate' };
  if (ratePerYen < 0) return { ok: false, error: 'negative-rate' };

  return { ok: true, value: { amountYen, ratePerYen, converted: amountYen * ratePerYen } };
}
