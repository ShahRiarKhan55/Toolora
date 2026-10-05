import { CURRENCY_CODES } from '@toolora/shared';
import type { CurrencyCode } from '@toolora/shared';
import { describe, expect, it, vi } from 'vitest';
import { HttpError } from '../../errors';
import { createCurrencyService } from './currencyService';
import { exchangeRateApi } from './providers/exchangeRateApi';
import { fawazahmed } from './providers/fawazahmed';
import { ProviderError } from './types';
import type { RateProvider, RateTable } from './types';

// 1 JPY = 0.0067 USD, 0.8 BDT, ... ; every supported code present.
function table(base: CurrencyCode, source = 'fake'): RateTable {
  const rates = Object.fromEntries(CURRENCY_CODES.map((c, i) => [c, 0.5 + i])) as Record<
    CurrencyCode,
    number
  >;
  rates[base] = 1;
  rates.BDT = 0.8;
  rates.USD = 0.0067;
  return { base, rates, updatedAt: '2026-10-05T00:00:00.000Z', source };
}

const okProvider = (id = 'fake'): RateProvider => ({
  id,
  latest: vi.fn((base: CurrencyCode) => Promise.resolve(table(base, id))),
});
const failing = (kind: ProviderError['kind']): RateProvider => ({
  id: 'bad',
  latest: vi.fn(() => Promise.reject(new ProviderError(kind, 'secret-detail'))),
});

describe('currency service', () => {
  it('converts JPY to BDT and USD, and returns the table', async () => {
    const svc = createCurrencyService({ providers: [okProvider()] });
    expect((await svc.convert('JPY', 'BDT', 1000)).converted).toBeCloseTo(800);
    expect((await svc.convert('JPY', 'USD', 1000)).converted).toBeCloseTo(6.7);
    const { table: t } = await svc.getRates('JPY');
    expect(t.rates.BDT).toBe(0.8);
    expect(t.rates.JPY).toBe(1);
  });

  it('accepts zero and rejects negative, NaN, infinite and oversized amounts', async () => {
    const svc = createCurrencyService({ providers: [okProvider()] });
    expect((await svc.convert('JPY', 'BDT', 0)).converted).toBe(0);
    for (const bad of [-1, NaN, Infinity, 1e13]) {
      await expect(svc.convert('JPY', 'BDT', bad)).rejects.toMatchObject({
        status: 400,
        code: 'invalid_amount',
      });
    }
  });

  it('falls back to the next provider when the first fails', async () => {
    const svc = createCurrencyService({ providers: [failing('http'), okProvider('second')] });
    expect((await svc.getRates('USD')).table.source).toBe('second');
  });

  it.each(['http', 'network', 'malformed'] as const)('maps %s failures to 502', async (kind) => {
    const svc = createCurrencyService({ providers: [failing(kind)] });
    const err = await svc.getRates('JPY').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(HttpError);
    expect(err).toMatchObject({ status: 502, code: 'upstream_unavailable' });
    expect((err as Error).message).not.toContain('secret-detail');
  });

  it('maps all-timeout failures to 504', async () => {
    const svc = createCurrencyService({ providers: [failing('timeout'), failing('timeout')] });
    await expect(svc.getRates('JPY')).rejects.toMatchObject({ status: 504 });
  });

  it('serves repeats from cache until the TTL expires', async () => {
    let t = 0;
    const p = okProvider();
    const svc = createCurrencyService({ providers: [p], ttlMs: 1000, now: () => t });
    expect((await svc.getRates('JPY')).cached).toBe(false);
    expect((await svc.getRates('JPY')).cached).toBe(true);
    expect(p.latest).toHaveBeenCalledTimes(1);
    t = 1001;
    expect((await svc.getRates('JPY')).cached).toBe(false);
    expect(p.latest).toHaveBeenCalledTimes(2);
  });

  it('does not cache failures', async () => {
    const p = okProvider();
    vi.mocked(p.latest).mockRejectedValueOnce(new ProviderError('http', 'x'));
    const svc = createCurrencyService({ providers: [p] });
    await expect(svc.getRates('JPY')).rejects.toBeInstanceOf(HttpError);
    expect((await svc.getRates('JPY')).cached).toBe(false);
  });

  it('de-duplicates simultaneous requests for one base', async () => {
    const p = okProvider();
    const svc = createCurrencyService({ providers: [p] });
    await Promise.all([svc.getRates('JPY'), svc.getRates('JPY'), svc.getRates('JPY')]);
    expect(p.latest).toHaveBeenCalledTimes(1);
  });
});

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), init);
}
const erBody = (extra: Record<string, number> = {}) => ({
  result: 'success',
  time_last_update_unix: 1791158551,
  rates: Object.fromEntries(CURRENCY_CODES.map((c) => [c, 2])),
  ...extra,
});

describe('exchangeRateApi adapter', () => {
  it('normalizes the response and hits a fixed URL built from the base', async () => {
    const f = vi.fn<typeof fetch>(() => Promise.resolve(jsonResponse(erBody())));
    const t = await exchangeRateApi(f).latest('JPY');
    expect(f.mock.calls[0]?.[0]).toBe('https://open.er-api.com/v6/latest/JPY');
    expect(t).toMatchObject({ base: 'JPY', source: 'exchangerate-api' });
    expect(t.rates.BDT).toBe(2);
    expect(t.rates.JPY).toBe(1);
    expect(t.updatedAt).toBe('2026-10-05T00:02:31.000Z');
  });

  it.each([
    ['non-success result', jsonResponse({ result: 'error' })],
    ['missing currency', jsonResponse({ ...erBody(), rates: { USD: 1 } })],
    ['zero rate', jsonResponse({ ...erBody(), rates: { ...erBody().rates, BDT: 0 } })],
    ['non-JSON body', new Response('<html>', { status: 200 })],
    ['HTTP 500', new Response('x', { status: 500 })],
  ])('rejects %s', async (_name, res) => {
    const f = vi.fn(() => Promise.resolve(res));
    await expect(exchangeRateApi(f).latest('JPY')).rejects.toBeInstanceOf(ProviderError);
  });

  it('classifies timeouts and network errors', async () => {
    const timeout = vi.fn(() =>
      Promise.reject(new DOMException('timed out', 'TimeoutError')),
    ) as unknown as typeof fetch;
    await expect(exchangeRateApi(timeout).latest('JPY')).rejects.toMatchObject({ kind: 'timeout' });
    const net = vi.fn(() =>
      Promise.reject(new TypeError('fetch failed')),
    ) as unknown as typeof fetch;
    await expect(exchangeRateApi(net).latest('JPY')).rejects.toMatchObject({ kind: 'network' });
  });
});

describe('fawazahmed adapter', () => {
  it('maps lowercase codes to the normalized table', async () => {
    const body = {
      date: '2026-10-04',
      jpy: Object.fromEntries(CURRENCY_CODES.map((c) => [c.toLowerCase(), 3])),
    };
    const f = vi.fn<typeof fetch>(() => Promise.resolve(jsonResponse(body)));
    const t = await fawazahmed(f).latest('JPY');
    expect(f.mock.calls[0]?.[0]).toContain('/currencies/jpy.json');
    expect(t).toMatchObject({ source: 'fawazahmed0', updatedAt: '2026-10-04T00:00:00.000Z' });
    expect(t.rates.BDT).toBe(3);
  });

  it('rejects a malformed body', async () => {
    const f = vi.fn(() => Promise.resolve(jsonResponse({ date: '2026-10-04' })));
    await expect(fawazahmed(f).latest('JPY')).rejects.toBeInstanceOf(ProviderError);
  });
});
