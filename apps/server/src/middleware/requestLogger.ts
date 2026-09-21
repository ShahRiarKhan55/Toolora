import { randomUUID } from 'node:crypto';
import type { Request, RequestHandler } from 'express';
import type { Logger } from '../logger';

/**
 * The full request path without the query string. `req.path` cannot be used for logging because
 * Express strips a router's mount prefix from it (`/api/health` would appear as `/health`), and the
 * query string is dropped on purpose: it may contain user input.
 */
export function requestPath(req: Request): string {
  return req.originalUrl.split('?')[0] ?? '/';
}

/**
 * Tags every request with an id (also returned as X-Request-Id) and logs one line per response.
 * Privacy: only method, path and status are logged - never query strings, headers or bodies.
 */
export function requestLogger(logger: Logger): RequestHandler {
  return (req, res, next) => {
    const requestId = randomUUID();
    res.locals['requestId'] = requestId;
    res.setHeader('X-Request-Id', requestId);

    const startedAt = process.hrtime.bigint();
    res.on('finish', () => {
      const durationMs = Math.round(Number(process.hrtime.bigint() - startedAt) / 1e6);
      logger.info('request', {
        requestId,
        method: req.method,
        path: requestPath(req),
        status: res.statusCode,
        durationMs,
      });
    });

    next();
  };
}
