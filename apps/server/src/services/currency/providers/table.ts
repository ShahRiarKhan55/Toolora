import { CURRENCY_CODES } from '@toolora/shared';
import type { CurrencyCode } from '@toolora/shared';
import { ProviderError } from '../types';
import type { RateTable } from '../types';

/** Picks the supported currencies out of a provider's code→rate map (`key` adapts the code to the
 *  provider's casing), rejecting anything missing, non-finite or non-positive. Shared by adapters. */
export function buildTable(
  base: CurrencyCode,
  source: string,
  updatedAt: Date,
  raw: Record<string, number>,
  key: (code: CurrencyCode) => string = (c) => c,
): RateTable {
  if (Number.isNaN(updatedAt.getTime())) throw new ProviderError('malformed', 'bad timestamp');
  const rates = {} as Record<CurrencyCode, number>;
  for (const code of CURRENCY_CODES) {
    const rate = code === base ? 1 : raw[key(code)];
    if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
      throw new ProviderError('malformed', `missing rate for ${code}`);
    }
    rates[code] = rate;
  }
  return { base, rates, updatedAt: updatedAt.toISOString(), source };
}
