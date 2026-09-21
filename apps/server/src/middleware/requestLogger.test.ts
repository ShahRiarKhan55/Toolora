import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import type { Logger } from '../logger';
import { requestLogger } from './requestLogger';

function fakeLogger() {
  const info = vi.fn();
  const logger: Logger = { debug: vi.fn(), info, warn: vi.fn(), error: vi.fn() };
  return { logger, info };
}

/** Mirrors the real app: the route lives in a router mounted under /api. */
function appWithMountedRoute(logger: Logger) {
  const app = express();
  app.use(requestLogger(logger));
  const router = express.Router();
  router.get('/health', (_req, res) => {
    res.json({ ok: true });
  });
  app.use('/api', router);
  return app;
}

describe('requestLogger', () => {
  it('logs the full path, including the router mount prefix', async () => {
    const { logger, info } = fakeLogger();

    await request(appWithMountedRoute(logger)).get('/api/health');

    await vi.waitFor(() => {
      expect(info).toHaveBeenCalledWith(
        'request',
        expect.objectContaining({ method: 'GET', path: '/api/health', status: 200 }),
      );
    });
  });

  it('never logs the query string', async () => {
    const { logger, info } = fakeLogger();

    await request(appWithMountedRoute(logger)).get(
      '/api/health?token=super-secret&q=my+private+text',
    );

    await vi.waitFor(() => {
      expect(info).toHaveBeenCalled();
    });
    expect(JSON.stringify(info.mock.calls)).not.toMatch(/super-secret|private|token/);
  });

  it('exposes the request id both in the log and as a response header', async () => {
    const { logger, info } = fakeLogger();

    const res = await request(appWithMountedRoute(logger)).get('/api/health');

    await vi.waitFor(() => {
      expect(info).toHaveBeenCalledWith(
        'request',
        expect.objectContaining({ requestId: res.headers['x-request-id'] as string }),
      );
    });
  });
});
