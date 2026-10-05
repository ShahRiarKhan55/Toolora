import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchRates, RatesError } from './api';

const good = {
  base: 'JPY',
  rates: { JPY: 1, BDT: 0.8, USD: 0.0067, BOGUS: 3, EUR: -1 },
  updatedAt: '2026-10-05T00:02:31.000Z',
  source: 'exchangerate-api',
  cached: false,
};

function respond(status: number, body: unknown) {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

async function kind(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (err) {
    return err instanceof RatesError ? err.kind : `other:${String(err)}`;
  }
  return 'no-error';
}

afterEach(() => vi.unstubAllGlobals());

describe('fetchRates', () => {
  it('calls only Toolora’s own API, with just the base currency', async () => {
    const fetchMock = respond(200, good);
    vi.stubGlobal('fetch', fetchMock);
    await fetchRates('JPY', new AbortController().signal);
    const url = String((fetchMock.mock.calls[0] as unknown[])[0]);
    expect(url).toBe('/api/currency/rates?base=JPY');
  });

  it('returns a clean table, dropping unknown currencies and invalid values', async () => {
    vi.stubGlobal('fetch', respond(200, good));
    const table = await fetchRates('JPY', new AbortController().signal);
    expect(table).toEqual({
      base: 'JPY',
      rates: { JPY: 1, BDT: 0.8, USD: 0.0067 },
      updatedAt: good.updatedAt,
      source: 'exchangerate-api',
      cached: false,
    });
  });

  it('maps HTTP failures to user-facing kinds', async () => {
    const signal = new AbortController().signal;
    const cases: [number, string][] = [
      [429, 'rate-limited'],
      [504, 'timeout'],
      [502, 'unavailable'],
      [500, 'unavailable'],
      [400, 'unsupported'],
    ];
    for (const [status, expected] of cases) {
      vi.stubGlobal('fetch', respond(status, { error: { code: 'x', message: 'raw server text' } }));
      expect(await kind(fetchRates('JPY', signal)), String(status)).toBe(expected);
    }
  });

  it('treats a network failure as unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    );
    expect(await kind(fetchRates('JPY', new AbortController().signal))).toBe('unavailable');
  });

  it('reports a timeout when the request times out', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new DOMException('timed out', 'TimeoutError'))),
    );
    expect(await kind(fetchRates('JPY', new AbortController().signal))).toBe('timeout');
  });

  it('rethrows a caller abort so it is not shown as an error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new DOMException('aborted', 'AbortError'))),
    );
    expect(await kind(fetchRates('JPY', new AbortController().signal))).toMatch(/^other:/);
  });

  it('rejects malformed bodies', async () => {
    const signal = new AbortController().signal;
    for (const body of [
      null,
      'text',
      {},
      { ...good, updatedAt: 'yesterday' },
      { ...good, cached: 'no' },
    ]) {
      vi.stubGlobal('fetch', respond(200, body));
      expect(await kind(fetchRates('JPY', signal))).toBe('malformed');
    }
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('<html>', { status: 200 }))),
    );
    expect(await kind(fetchRates('JPY', signal))).toBe('malformed');
  });
});
