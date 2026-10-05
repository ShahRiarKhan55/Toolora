export const TAX_RATES = [10, 8] as const;
export type TaxRate = (typeof TAX_RATES)[number];

export type TaxMode = 'exclusive' | 'inclusive';

export const ROUNDING_OPTIONS = [
  { id: 'floor', label: 'Round down (切り捨て)' },
  { id: 'round', label: 'Round half up (四捨五入)' },
  { id: 'ceil', label: 'Round up (切り上げ)' },
] as const;
export type Rounding = (typeof ROUNDING_OPTIONS)[number]['id'];

/** Largest amount accepted, in yen: keeps every intermediate value far inside safe integers. */
export const MAX_TAX_AMOUNT = 999_999_999_999;

export type TaxError = 'empty' | 'invalid' | 'negative' | 'too-precise' | 'too-large';

export const TAX_ERROR_MESSAGES: Record<TaxError, string> = {
  empty: 'Enter an amount in yen.',
  invalid: 'Enter the amount as a plain number, such as 1100 or 980.5.',
  negative: 'Enter an amount of 0 or more.',
  'too-precise': 'Use at most 2 decimal places.',
  'too-large': 'That amount is too large to calculate.',
};

export interface TaxInput {
  amount: string;
  rate: TaxRate;
  mode: TaxMode;
  rounding: Rounding;
}

export interface TaxResult {
  rate: TaxRate;
  preTax: number;
  tax: number;
  total: number;
}

export type TaxOutcome = { ok: true; value: TaxResult } | { ok: false; error: TaxError };

/** Amount in hundredths of a yen, parsed from the text so decimals never pass through floating point. */
function parseHundredths(
  text: string,
): { ok: true; value: bigint } | { ok: false; error: TaxError } {
  const cleaned = text.trim().replace(/,/g, '');
  if (cleaned === '') return { ok: false, error: 'empty' };
  if (/^-/.test(cleaned)) return { ok: false, error: 'negative' };
  const match = /^(\d*)(?:\.(\d*))?$/.exec(cleaned);
  if (!match || (match[1] === '' && !match[2])) return { ok: false, error: 'invalid' };
  const fraction = match[2] ?? '';
  if (fraction.length > 2) return { ok: false, error: 'too-precise' };
  const hundredths = BigInt((match[1] || '0') + fraction.padEnd(2, '0'));
  if (hundredths > BigInt(MAX_TAX_AMOUNT) * 100n) return { ok: false, error: 'too-large' };
  return { ok: true, value: hundredths };
}

/** Integer division of non-negative values with the chosen rounding. */
function divide(numerator: bigint, denominator: bigint, rounding: Rounding): bigint {
  if (rounding === 'floor') return numerator / denominator;
  if (rounding === 'ceil') return (numerator + denominator - 1n) / denominator;
  return (2n * numerator + denominator) / (2n * denominator);
}

/**
 * Standard 8% / 10% consumption-tax arithmetic only. The tax is rounded to a whole yen in the chosen
 * direction (businesses may pick any of the three); the other figure follows from it, so
 * pre-tax + tax always equals the tax-inclusive total exactly. All math is exact (BigInt hundredths).
 */
export function calculateTax({ amount, rate, mode, rounding }: TaxInput): TaxOutcome {
  const parsed = parseHundredths(amount);
  if (!parsed.ok) return parsed;
  const cents = parsed.value;
  const percent = BigInt(rate);

  let taxYen: bigint;
  let preTax: bigint;
  let total: bigint;
  if (mode === 'exclusive') {
    taxYen = divide(cents * percent, 10_000n, rounding);
    preTax = cents;
    total = cents + taxYen * 100n;
  } else {
    taxYen = divide(cents * percent, (100n + percent) * 100n, rounding);
    total = cents;
    preTax = cents - taxYen * 100n;
  }
  const yen = (hundredths: bigint) => Number(hundredths) / 100;
  return { ok: true, value: { rate, preTax: yen(preTax), tax: Number(taxYen), total: yen(total) } };
}

const yenFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'JPY',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** ¥1,100 — whole yen unless the figure really has a fraction (a decimal input amount). */
export function formatYen(value: number): string {
  return yenFormat.format(value);
}
