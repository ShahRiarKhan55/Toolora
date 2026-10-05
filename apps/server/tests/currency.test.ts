import { CURRENCY_CODES } from '@toolora/shared';
import type { CurrencyCode } from '@toolora/shared';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
import type { Logger } from '../src/logger';
import { createCurrencyService } from '../src/services/currency/currencyService';
import { ProviderError } from '../src/services/currency/types';
import type { RateProvider } from '../src/services/currency/types';

const logger: Logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const db = { ping: () => Promise.resolve(), prisma: {} } as never;

const provider = (impl?: RateProvider['latest']): RateProvider => ({
  id: 'fake',
  latest:
    impl ??
    ((base: CurrencyCode) =>
      Promise.resolve({
        base,
        rates: Object.fromEntries(CURRENCY_CODES.map((c) => [c, c === base ? 1 : 2])) as Record<
          CurrencyCode,
          number
        >,
        updatedAt: '2026-10-05T00:00:00.000Z',
        source: 'fake',
      })),
});

function appWith(p: RateProvider = provider()) {
  return createApp({
    logger,
    db,
    accountsEnabled: false,
    currency: createCurrencyService({ providers: [p] }),
  });
}

const errCode = (res: request.Response) => (res.body as { error: { code: string } }).error.code;

describe('GET /api/currency/rates', () => {
  it('returns normalized rates for the requested symbols, case-insensitively', async () => {
    const res = await request(appWith()).get('/api/currency/rates?base=jpy&symbols=bdt,USD');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      base: 'JPY',
      rates: { BDT: 2, USD: 2 },
      updatedAt: '2026-10-05T00:00:00.000Z',
      source: 'fake',
      cached: false,
    });
    expect(res.headers['cache-control']).toContain('s-maxage');
  });

  it('returns every supported currency when symbols is omitted, and reports cache hits', async () => {
    const app = appWith();
    await request(app).get('/api/currency/rates?base=JPY');
    const res = await request(app).get('/api/currency/rates?base=JPY');
    expect(Object.keys((res.body as { rates: object }).rates)).toHaveLength(CURRENCY_CODES.length);
    expect((res.body as { cached: boolean }).cached).toBe(true);
  });

  it.each([
    ['/api/currency/rates', 400, 'missing_parameter'],
    ['/api/currency/rates?base=XXX', 400, 'invalid_currency'],
    ['/api/currency/rates?base=JPY&symbols=BDT,XXX', 400, 'invalid_currency'],
    ['/api/currency/rates?base=JPY&symbols=', 400, 'invalid_currency'],
    ['/api/currency/rates?base=JPY&symbols=BDT,bdt', 400, 'duplicate_symbols'],
    [
      `/api/currency/rates?base=JPY&symbols=${Array(17).fill('USD').join(',')}`,
      400,
      'too_many_symbols',
    ],
    ['/api/currency/rates?base=JPY&symbols[]=USD', 400, 'invalid_parameter'],
    ['/api/currency/rates?base=JPY&base=USD', 400, 'invalid_currency'],
    ['/api/currency/rates?base=JPY&amount=abc', 400, 'invalid_parameter'],
  ])('rejects %s', async (url, status, code) => {
    const res = await request(appWith()).get(url);
    expect(res.status).toBe(status);
    expect(errCode(res)).toBe(code);
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('refuses URL-style parameters and has no proxy route', async () => {
    const latest = vi.fn(provider().latest);
    const app = appWith({ id: 'fake', latest });
    const a = await request(app).get('/api/currency/rates?base=JPY&url=http://169.254.169.254/');
    expect(a.status).toBe(400);
    expect((await request(app).get('/api/proxy?url=http://example.com')).status).toBe(404);
    expect((await request(app).get('/api/currency/rates?base=http://evil.test')).status).toBe(400);
    expect(latest).not.toHaveBeenCalled();
  });

  it('answers non-GET methods with 405 and an Allow header', async () => {
    const res = await request(appWith()).post('/api/currency/rates?base=JPY').send({});
    expect(res.status).toBe(405);
    expect(errCode(res)).toBe('method_not_allowed');
    expect(res.headers['allow']).toBe('GET, HEAD');
  });

  it('maps upstream failure to 502 without leaking provider details', async () => {
    const res = await request(
      appWith(
        provider(() => Promise.reject(new ProviderError('http', 'key=SECRET123 status 500'))),
      ),
    ).get('/api/currency/rates?base=JPY');
    expect(res.status).toBe(502);
    expect(errCode(res)).toBe('upstream_unavailable');
    expect(res.text).not.toContain('SECRET123');
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('maps upstream timeout to 504', async () => {
    const res = await request(
      appWith(provider(() => Promise.reject(new ProviderError('timeout', 'slow')))),
    ).get('/api/currency/rates?base=JPY');
    expect(res.status).toBe(504);
    expect(errCode(res)).toBe('upstream_timeout');
  });

  it('rate limits a client with 429 and Retry-After, leaving other routes alone', async () => {
    const app = createApp({
      logger,
      db,
      accountsEnabled: false,
      currency: createCurrencyService({ providers: [provider()] }),
    });
    // Default limit is 60/min; exceed it.
    let last = 200;
    for (let i = 0; i < 61; i++) {
      last = (await request(app).get('/api/currency/rates?base=JPY&symbols=USD')).status;
    }
    expect(last).toBe(429);
    const limited = await request(app).get('/api/currency/rates?base=JPY');
    expect(errCode(limited)).toBe('rate_limited');
    expect(limited.headers['retry-after']).toBeDefined();
    expect((await request(app).get('/api/health')).status).toBe(200);
  });

  it('is not mounted when no currency service is supplied', async () => {
    const app = createApp({ logger, db, accountsEnabled: false });
    expect((await request(app).get('/api/currency/rates?base=JPY')).status).toBe(404);
  });
});
