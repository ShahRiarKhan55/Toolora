import { isCurrencyCode } from '@toolora/shared';
import type { CurrencyCode } from '@toolora/shared';

export interface RateTable {
  base: CurrencyCode;
  rates: Partial<Record<CurrencyCode, number>>;
  updatedAt: string;
  source: string;
  /** True when Toolora's server answered from its short-term cache; the rate date is unaffected. */
  cached: boolean;
}

export type RatesFailure = 'timeout' | 'rate-limited' | 'unavailable' | 'malformed' | 'unsupported';

export class RatesError extends Error {
  readonly kind: RatesFailure;
  constructor(kind: RatesFailure) {
    super(kind);
    this.name = 'RatesError';
    this.kind = kind;
  }
}

/** What the user reads for each failure. Server messages are never shown. */
export const RATES_ERROR_MESSAGES: Record<RatesFailure, string> = {
  timeout: 'The exchange-rate service took too long to respond. Please try again.',
  'rate-limited': 'Too many requests right now. Wait a minute, then try again.',
  unavailable: 'Exchange rates are temporarily unavailable. Please try again.',
  malformed: 'The exchange-rate service sent a response we could not read. Please try again later.',
  unsupported: 'That currency is not supported.',
};

const TIMEOUT_MS = 10_000;

function parseTable(base: CurrencyCode, body: unknown): RateTable {
  if (typeof body !== 'object' || body === null) throw new RatesError('malformed');
  const { rates, updatedAt, source, cached } = body as Record<string, unknown>;
  if (
    typeof rates !== 'object' ||
    rates === null ||
    typeof updatedAt !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}/.test(updatedAt) ||
    typeof source !== 'string' ||
    typeof cached !== 'boolean'
  ) {
    throw new RatesError('malformed');
  }
  const clean: RateTable['rates'] = {};
  for (const [code, value] of Object.entries(rates)) {
    if (isCurrencyCode(code) && typeof value === 'number' && Number.isFinite(value) && value > 0) {
      clean[code] = value;
    }
  }
  return { base, rates: clean, updatedAt, source, cached };
}

/**
 * Fetches every supported rate for `base` from Toolora's own API (never from a provider). One call
 * per base currency; the UI keeps the result, so picking another target needs no new request. The
 * URL is built only from a validated currency code, and the amount is never sent.
 */
export async function fetchRates(base: CurrencyCode, signal: AbortSignal): Promise<RateTable> {
  let response: Response;
  try {
    response = await fetch(`/api/currency/rates?base=${base}`, {
      signal: AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)]),
      headers: { Accept: 'application/json' },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') throw new RatesError('timeout');
    // A caller abort (unmount, currency changed) is rethrown so the caller can ignore it.
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new RatesError('unavailable');
  }

  if (!response.ok) {
    if (response.status === 429) throw new RatesError('rate-limited');
    if (response.status === 504) throw new RatesError('timeout');
    throw new RatesError(response.status === 400 ? 'unsupported' : 'unavailable');
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new RatesError('malformed');
  }
  return parseTable(base, body);
}
