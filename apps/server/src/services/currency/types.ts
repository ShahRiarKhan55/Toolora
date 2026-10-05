import type { CurrencyCode } from '@toolora/shared';

/** Toolora's own rate model; provider response shapes never leave the adapters. */
export interface RateTable {
  base: CurrencyCode;
  /** Units of each currency per 1 unit of `base`, for every supported currency. */
  rates: Record<CurrencyCode, number>;
  /** When the provider says the rates were published (ISO 8601). */
  updatedAt: string;
  /** Stable provider identifier. */
  source: string;
}

export type ProviderFailure = 'timeout' | 'network' | 'http' | 'malformed';

export class ProviderError extends Error {
  readonly kind: ProviderFailure;

  constructor(kind: ProviderFailure, message: string) {
    super(message);
    this.name = 'ProviderError';
    this.kind = kind;
  }
}

export interface RateProvider {
  readonly id: string;
  /** Throws ProviderError on any failure. `base` is already validated against the whitelist. */
  latest: (base: CurrencyCode) => Promise<RateTable>;
}

/**
 * One day of a historical series. Not implemented by any provider: no candidate has clear terms for
 * redistributing history (see docs/architecture.md 6c). A provider that adds `history` must also
 * satisfy those terms; the service/route/UI for it are built then, not before.
 */
export interface HistoricalPoint {
  /** Publication date, YYYY-MM-DD (the provider's date, not Toolora's fetch time). */
  date: string;
  rate: number;
}

export interface HistoricalRateProvider extends RateProvider {
  /** `days` is already validated and capped (initial maximum 30). Throws ProviderError. */
  history: (base: CurrencyCode, quote: CurrencyCode, days: number) => Promise<HistoricalPoint[]>;
}

export type FetchFn = typeof fetch;
