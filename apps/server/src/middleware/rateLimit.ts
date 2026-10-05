import type { RequestHandler } from 'express';
import { HttpError } from '../errors';

/**
 * Fixed-window per-client limiter. Best-effort only: state is per process, so on serverless hosts each
 * warm instance counts separately and cold starts reset it. It stops accidental hammering, not a
 * distributed attack; replace the Map with a shared store for real protection.
 */
export function rateLimit({
  limit,
  windowMs,
  now = Date.now,
  maxClients = 10_000,
}: {
  limit: number;
  windowMs: number;
  now?: () => number;
  maxClients?: number;
}): RequestHandler {
  const clients = new Map<string, { count: number; resetAt: number }>();

  return (req, res, next) => {
    const t = now();
    const key = req.ip ?? 'unknown';
    let entry = clients.get(key);
    if (!entry || entry.resetAt <= t) {
      if (clients.size >= maxClients) {
        for (const [k, v] of clients) if (v.resetAt <= t) clients.delete(k);
        // Still full of live windows: drop the oldest rather than grow without bound.
        const oldest = clients.keys().next().value;
        if (clients.size >= maxClients && oldest !== undefined) clients.delete(oldest);
      }
      entry = { count: 0, resetAt: t + windowMs };
      clients.set(key, entry);
    }
    entry.count += 1;

    if (entry.count > limit) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((entry.resetAt - t) / 1000))));
      next(new HttpError(429, 'rate_limited', 'Too many requests. Please try again shortly.'));
      return;
    }
    next();
  };
}
