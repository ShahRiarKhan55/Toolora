import { MAX_CURRENCY_AMOUNT } from '@toolora/shared';
import type { CurrencyCode } from '@toolora/shared';
import { HttpError } from '../../errors';
import { TtlCache } from '../cache';
import { exchangeRateApi } from './providers/exchangeRateApi';
import { fawazahmed } from './providers/fawazahmed';
import { ProviderError } from './types';
import type { RateProvider, RateTable } from './types';

export const MAX_AMOUNT = MAX_CURRENCY_AMOUNT;

export interface CurrencyServiceOptions {
  /** Tried in order; the first success wins. Defaults to the production provider chain. */
  providers?: RateProvider[];
  ttlMs?: number;
  now?: () => number;
}

export interface RatesResult {
  table: RateTable;
  cached: boolean;
}

export function createCurrencyService({
  providers = [exchangeRateApi(), fawazahmed()],
  ttlMs = 60 * 60 * 1000,
  now,
}: CurrencyServiceOptions = {}) {
  const cache = new TtlCache<RateTable>(ttlMs, 64, now);

  async function getRates(base: CurrencyCode): Promise<RatesResult> {
    const { value, cached } = await cache.getOrLoad(base, async () => {
      const failures: ProviderError[] = [];
      for (const provider of providers) {
        try {
          return await provider.latest(base);
        } catch (err) {
          failures.push(
            err instanceof ProviderError ? err : new ProviderError('network', 'unexpected'),
          );
        }
      }
      // Provider details stay in the server; the kinds only choose 504 vs 502.
      const allTimeouts = failures.length > 0 && failures.every((f) => f.kind === 'timeout');
      throw allTimeouts
        ? new HttpError(
            504,
            'upstream_timeout',
            'The exchange-rate provider took too long to respond.',
          )
        : new HttpError(502, 'upstream_unavailable', 'Exchange rates are temporarily unavailable.');
    });
    return { table: value, cached };
  }

  async function getRate(from: CurrencyCode, to: CurrencyCode) {
    const result = await getRates(from);
    return { rate: result.table.rates[to], ...result };
  }

  async function convert(from: CurrencyCode, to: CurrencyCode, amount: number) {
    if (!Number.isFinite(amount) || amount < 0 || amount > MAX_AMOUNT) {
      throw new HttpError(
        400,
        'invalid_amount',
        `Amount must be a number from 0 to ${MAX_AMOUNT}.`,
      );
    }
    const { rate, ...rest } = await getRate(from, to);
    return { amount, converted: amount * rate, rate, ...rest };
  }

  // Historical rates are deferred: neither chosen provider is wired for them in this phase.
  return { getRates, getRate, convert };
}

export type CurrencyService = ReturnType<typeof createCurrencyService>;
