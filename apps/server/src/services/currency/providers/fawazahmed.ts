import { z } from 'zod';
import { ProviderError } from '../types';
import type { FetchFn, RateProvider } from '../types';
import { getJson } from './http';
import { buildTable } from './table';

/** @fawazahmed0/currency-api via the jsDelivr CDN: no key, 200+ currencies, published daily (date
 *  only, so the timestamp is that day's UTC midnight). Used as the fallback. */
export function fawazahmed(fetchFn: FetchFn = fetch): RateProvider {
  return {
    id: 'fawazahmed0',
    async latest(base) {
      const lower = base.toLowerCase();
      const url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${lower}.json`;
      const body = await getJson(fetchFn, url);
      const parsed = z.looseObject({ date: z.string() }).safeParse(body);
      const rates = z
        .record(z.string(), z.number())
        .safeParse((body as Record<string, unknown>)[lower]);
      if (!parsed.success || !rates.success)
        throw new ProviderError('malformed', 'unexpected response shape');
      const updatedAt = new Date(`${parsed.data.date}T00:00:00Z`);
      return buildTable(base, 'fawazahmed0', updatedAt, rates.data, (c) => c.toLowerCase());
    },
  };
}
