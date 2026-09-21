import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { HttpError } from '../errors';
import type { Logger } from '../logger';
import { errorHandler, routeNotFound } from './errorHandler';

/** Returns the logger plus the `error` mock, so assertions do not touch unbound methods. */
function fakeLogger() {
  const error = vi.fn();
  const logger: Logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error };
  return { logger, error };
}

function appThatThrows(thrown: unknown, logger: Logger) {
  const app = express();
  app.get('/boom', () => {
    throw thrown;
  });
  app.get('/async-boom', async () => {
    await Promise.resolve();
    throw thrown;
  });
  app.use(routeNotFound);
  app.use(errorHandler(logger));
  return app;
}

describe('errorHandler', () => {
  it('hides internal details of unexpected errors and logs them instead', async () => {
    const { logger, error } = fakeLogger();
    const secret = new Error('SQLITE_CORRUPT at /home/deploy/secret-path.db');

    const res = await request(appThatThrows(secret, logger)).get('/boom');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { code: 'internal_error', message: 'Something went wrong on our side.' },
    });
    expect(res.text).not.toContain('secret-path');
    expect(res.text).not.toContain('stack');
    expect(error).toHaveBeenCalledWith(
      'Unhandled error',
      expect.objectContaining({ path: '/boom', err: secret }),
    );
  });

  it('handles rejections from async route handlers (Express 5)', async () => {
    const { logger } = fakeLogger();

    const res = await request(appThatThrows(new Error('async failure'), logger)).get('/async-boom');

    expect(res.status).toBe(500);
    expect(res.text).not.toContain('async failure');
  });

  it('handles non-Error throwables', async () => {
    const { logger } = fakeLogger();

    const res = await request(appThatThrows('just a string', logger)).get('/boom');

    expect(res.status).toBe(500);
    expect(res.text).not.toContain('just a string');
  });

  it('passes through the message and status of an HttpError without logging it as a crash', async () => {
    const { logger, error } = fakeLogger();
    const httpError = new HttpError(422, 'invalid_thing', 'That thing is not valid.');

    const res = await request(appThatThrows(httpError, logger)).get('/boom');

    expect(res.status).toBe(422);
    expect(res.body).toEqual({
      error: { code: 'invalid_thing', message: 'That thing is not valid.' },
    });
    expect(error).not.toHaveBeenCalled();
  });

  it('logs the full path of a crash inside a mounted router, without the query string', async () => {
    const { logger, error } = fakeLogger();
    const app = express();
    const router = express.Router();
    router.get('/boom', () => {
      throw new Error('kaput');
    });
    app.use('/api', router);
    app.use(errorHandler(logger));

    await request(app).get('/api/boom?email=someone@example.com');

    expect(error).toHaveBeenCalledWith(
      'Unhandled error',
      expect.objectContaining({ path: '/api/boom' }),
    );
    expect(JSON.stringify(error.mock.calls)).not.toContain('someone@example.com');
  });

  it('answers unmatched routes with a JSON 404', async () => {
    const { logger } = fakeLogger();

    const res = await request(appThatThrows(new Error('unused'), logger)).get('/nope');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: 'not_found', message: 'Resource not found.' } });
  });
});
