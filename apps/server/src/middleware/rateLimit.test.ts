import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { errorHandler } from './errorHandler';
import { rateLimit } from './rateLimit';

const noop = () => undefined;

function appWith(t: { now: number }, maxClients?: number) {
  const app = express();
  app.use(rateLimit({ limit: 2, windowMs: 1000, now: () => t.now, maxClients }));
  app.get('/', (_req, res) => res.send('ok'));
  app.use(errorHandler({ debug: noop, info: noop, warn: noop, error: noop }));
  return app;
}

describe('rateLimit', () => {
  it('blocks after the limit and recovers when the window passes', async () => {
    const t = { now: 0 };
    const app = appWith(t);
    expect((await request(app).get('/')).status).toBe(200);
    expect((await request(app).get('/')).status).toBe(200);
    expect((await request(app).get('/')).status).toBe(429);
    t.now = 1001;
    expect((await request(app).get('/')).status).toBe(200);
  });

  it('stays bounded when many clients appear', async () => {
    const t = { now: 0 };
    const app = appWith(t, 2);
    for (const ip of ['1.1.1.1', '2.2.2.2', '3.3.3.3']) {
      app.set('trust proxy', true);
      expect((await request(app).get('/').set('X-Forwarded-For', ip)).status).toBe(200);
    }
  });
});
