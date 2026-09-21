import type { ErrorRequestHandler, RequestHandler } from 'express';
import { HttpError, notFoundError } from '../errors';
import type { Logger } from '../logger';
import { requestPath } from './requestLogger';

export interface ErrorBody {
  error: { code: string; message: string };
}

/** Catch-all for requests no route handled. Must be registered after all routes. */
export const routeNotFound: RequestHandler = (_req, _res, next) => {
  next(notFoundError());
};

/** Body parsers and friends attach a 4xx `status` to their errors. */
function clientErrorStatus(err: unknown): number | undefined {
  if (typeof err !== 'object' || err === null || !('status' in err)) return undefined;
  const { status } = err;
  return typeof status === 'number' && status >= 400 && status < 500 ? status : undefined;
}

const clientMessages: Record<number, string> = {
  400: 'The request could not be understood.',
  413: 'The request body is too large.',
};

/**
 * Converts every error into a small JSON body. Stack traces and internal messages are written to
 * the log only - they are never sent to the client, in any environment.
 */
export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (err: unknown, req, res, next) => {
    if (res.headersSent) {
      next(err);
      return;
    }

    let status = 500;
    let body: ErrorBody = {
      error: { code: 'internal_error', message: 'Something went wrong on our side.' },
    };

    if (err instanceof HttpError) {
      status = err.status;
      body = { error: { code: err.code, message: err.message } };
    } else {
      const clientStatus = clientErrorStatus(err);
      if (clientStatus !== undefined) {
        status = clientStatus;
        body = {
          error: {
            code: 'bad_request',
            message: clientMessages[clientStatus] ?? 'The request could not be processed.',
          },
        };
      }
    }

    if (status >= 500) {
      logger.error('Unhandled error', {
        requestId: res.locals['requestId'],
        method: req.method,
        path: requestPath(req),
        err,
      });
    }

    res.status(status).json(body);
  };
}
