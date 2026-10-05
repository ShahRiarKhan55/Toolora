import { z } from 'zod';
import { ProviderError } from '../types';
import type { FetchFn, RateProvider } from '../types';
import { getJson } from './http';
import { buildTable } from './table';

const schema = z.object({
  result: z.literal('success'),
  time_last_update_unix: z.number(),
  rates: z.record(z.string(), z.number()),
});

/** open.er-api.com (ExchangeRate-API "open access"): no key, ~160 currencies incl. BDT, refreshed
 *  once a day. Terms require attribution - the site must link https://www.exchangerate-api.com. */
export function exchangeRateApi(fetchFn: FetchFn = fetch): RateProvider {
  return {
    id: 'exchangerate-api',
    async latest(base) {
      const body = await getJson(fetchFn, `https://open.er-api.com/v6/latest/${base}`);
      const parsed = schema.safeParse(body);
      if (!parsed.success) throw new ProviderError('malformed', 'unexpected response shape');
      const updatedAt = new Date(parsed.data.time_last_update_unix * 1000);
      return buildTable(base, 'exchangerate-api', updatedAt, parsed.data.rates);
    },
  };
}
