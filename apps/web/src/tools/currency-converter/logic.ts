import { CURRENCY_INFO, MAX_CURRENCY_AMOUNT } from '@toolora/shared';
import type { CurrencyCode } from '@toolora/shared';
import { parseDecimal } from '../../lib/parseDecimal';

export type AmountError = 'empty' | 'invalid' | 'negative' | 'too-large';

export const AMOUNT_ERROR_MESSAGES: Record<AmountError, string> = {
  empty: 'Enter an amount to convert.',
  invalid: 'Enter a valid number, for example 10000 or 2500.50.',
  negative: 'The amount cannot be negative.',
  'too-large': `The amount must be ${MAX_CURRENCY_AMOUNT.toLocaleString('en-US')} or less.`,
};

export type AmountOutcome = { ok: true; value: number } | { ok: false; error: AmountError };

// "100,000" and "1,234,567.89" are accepted; "1,5" is not (it could mean 1.5 or 15, so we refuse to guess).
const THOUSANDS_GROUPED = /^\d{1,3}(,\d{3})+(\.\d+)?$/;

export function parseAmount(input: string): AmountOutcome {
  const trimmed = input.trim();
  if (trimmed === '') return { ok: false, error: 'empty' };
  const value = parseDecimal(
    THOUSANDS_GROUPED.test(trimmed) ? trimmed.replaceAll(',', '') : trimmed,
  );
  if (value === undefined) return { ok: false, error: 'invalid' };
  if (value < 0) return { ok: false, error: 'negative' };
  if (value > MAX_CURRENCY_AMOUNT) return { ok: false, error: 'too-large' };
  return { ok: true, value };
}

/**
 * Amounts use the currency's own minor units (¥ 0, $ 2) from 1 upwards; below 1 they keep 3
 * significant digits so ¥1 → $0.00671 is not shown as a misleading $0.01.
 */
export function formatAmount(value: number, code: CurrencyCode): string {
  const minor = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: code,
  }).resolvedOptions().maximumFractionDigits;
  const options: Intl.NumberFormatOptions =
    value === 0 || value >= 1
      ? { minimumFractionDigits: minor, maximumFractionDigits: minor }
      : { maximumSignificantDigits: 3 };
  return `${new Intl.NumberFormat('en-US', options).format(value)} ${code}`;
}

/** Rates need more precision than amounts: 6 significant digits (150.123, 0.0066667). */
export function formatRate(from: CurrencyCode, to: CurrencyCode, rate: number): string {
  const text = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 6 }).format(rate);
  return `1 ${from} = ${text} ${to}`;
}

export function currencyLabel(code: CurrencyCode): string {
  const { name, symbol } = CURRENCY_INFO[code];
  return `${code} — ${name} (${symbol})`;
}

/**
 * Provider ids as emitted by `/api/currency/rates` → what the UI says. An id not listed here is
 * reported as unlisted, never silently credited to ExchangeRate-API.
 */
export const SOURCES: Record<string, { name: string; url: string }> = {
  'exchangerate-api': { name: 'ExchangeRate-API', url: 'https://www.exchangerate-api.com' },
  fawazahmed0: {
    name: 'fawazahmed0 currency-api',
    url: 'https://github.com/fawazahmed0/exchange-api',
  },
};

export function sourceName(source: string): string {
  return SOURCES[source]?.name ?? 'an unlisted provider';
}

/** `YYYY-MM-DD` (UTC) of the provider's publication timestamp. */
export function rateDate(updatedAt: string): string {
  return updatedAt.slice(0, 10);
}

export interface Quote {
  amount: number;
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number;
  updatedAt: string;
  source: string;
}

export function convertAmount(amount: number, rate: number): number {
  return amount * rate;
}

export function buildCopyText(quote: Quote): string {
  const converted = convertAmount(quote.amount, quote.rate);
  return [
    `${formatAmount(quote.amount, quote.from)} = ${formatAmount(converted, quote.to)}`,
    `Rate: ${formatRate(quote.from, quote.to, quote.rate)}`,
    `Daily reference rate: ${rateDate(quote.updatedAt)}`,
    `Source: ${sourceName(quote.source)}`,
  ].join('\n');
}

export interface PopularPair {
  from: CurrencyCode;
  to: CurrencyCode;
}

export const POPULAR_PAIRS: readonly PopularPair[] = (
  [
    ['JPY', 'BDT'],
    ['BDT', 'JPY'],
    ['JPY', 'USD'],
    ['USD', 'JPY'],
    ['JPY', 'EUR'],
    ['EUR', 'JPY'],
    ['JPY', 'GBP'],
    ['GBP', 'JPY'],
    ['JPY', 'INR'],
    ['INR', 'JPY'],
    ['JPY', 'CNY'],
    ['JPY', 'KRW'],
  ] as const
).map(([from, to]) => ({ from, to }));
