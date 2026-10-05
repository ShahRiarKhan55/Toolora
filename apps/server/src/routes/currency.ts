import { CURRENCY_CODES, isCurrencyCode } from '@toolora/shared';
import type { CurrencyCode } from '@toolora/shared';
import { Router } from 'express';
import { HttpError } from '../errors';
import { rateLimit } from '../middleware/rateLimit';
import type { CurrencyService } from '../services/currency/currencyService';

const MAX_SYMBOLS = CURRENCY_CODES.length;
const ALLOWED_PARAMS = new Set(['base', 'symbols']);

function code(value: unknown, name: string): CurrencyCode {
  const upper = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (!isCurrencyCode(upper)) {
    throw new HttpError(
      400,
      'invalid_currency',
      `${name} must be one of: ${CURRENCY_CODES.join(', ')}.`,
    );
  }
  return upper;
}

/** Strict parse: only `base` (required) and `symbols` (optional, comma-separated, no duplicates). */
function parseQuery(query: Record<string, unknown>): {
  base: CurrencyCode;
  symbols: CurrencyCode[];
} {
  for (const key of Object.keys(query)) {
    if (!ALLOWED_PARAMS.has(key)) {
      throw new HttpError(400, 'invalid_parameter', `Unknown parameter: ${key.slice(0, 32)}.`);
    }
  }
  if (query['base'] === undefined)
    throw new HttpError(400, 'missing_parameter', 'base is required.');
  const base = code(query['base'], 'base');

  const raw = query['symbols'];
  if (raw === undefined) return { base, symbols: [...CURRENCY_CODES] };
  if (typeof raw !== 'string' || raw.length > 200) {
    throw new HttpError(400, 'invalid_currency', 'symbols must be a comma-separated list.');
  }
  const parts = raw.split(',');
  if (parts.length > MAX_SYMBOLS) {
    throw new HttpError(400, 'too_many_symbols', `At most ${MAX_SYMBOLS} symbols are allowed.`);
  }
  const symbols = parts.map((p) => code(p, 'symbols'));
  if (new Set(symbols).size !== symbols.length) {
    throw new HttpError(400, 'duplicate_symbols', 'symbols must not repeat a currency.');
  }
  return { base, symbols };
}

export function currencyRouter({
  currency,
  limit = 60,
}: {
  currency: CurrencyService;
  /** Requests per client per minute. */
  limit?: number;
}): Router {
  const router = Router();
  router.use(rateLimit({ limit, windowMs: 60_000 }));

  router
    .route('/rates')
    .get(async (req, res) => {
      const { base, symbols } = parseQuery(req.query);
      const { table, cached } = await currency.getRates(base);
      const rates: Record<string, number> = {};
      for (const s of symbols) rates[s] = table.rates[s];

      // Only successes are shareable; errors keep the /api default (no-store).
      res.setHeader(
        'Cache-Control',
        'public, max-age=300, s-maxage=600, stale-while-revalidate=600',
      );
      res.json({ base, rates, updatedAt: table.updatedAt, source: table.source, cached });
    })
    .all((_req, res, next) => {
      res.setHeader('Allow', 'GET, HEAD');
      next(new HttpError(405, 'method_not_allowed', 'Only GET is supported.'));
    });

  return router;
}
