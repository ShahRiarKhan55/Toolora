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

export type FetchFn = typeof fetch;
