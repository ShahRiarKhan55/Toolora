import request from 'supertest';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
import { createDatabase } from '../src/db';
import type { Logger } from '../src/logger';

const silentLogger: Logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };

// Real Prisma client + real SQLite driver, just in memory.
const db = createDatabase(':memory:');
const app = createApp({ logger: silentLogger, db });

afterAll(async () => {
  await db.close();
});

describe('GET /api/health', () => {
  it('reports ok when the database answers', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      database: 'ok',
      uptimeSeconds: expect.any(Number) as number,
    });
  });

  it('reports degraded with 503 when the database is unavailable, without leaking the reason', async () => {
    const brokenApp = createApp({
      logger: silentLogger,
      db: { ...db, ping: () => Promise.reject(new Error('unable to open /var/db/private.sqlite')) },
    });

    const res = await request(brokenApp).get('/api/health');

    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({ status: 'degraded', database: 'unavailable' });
    expect(res.text).not.toContain('private.sqlite');
  });
});

describe('GET /api/health with accounts closed', () => {
  it('does not touch the database, so a stateless host (Vercel) stays healthy', async () => {
    const ping = vi.fn(() => Promise.reject(new Error('no writable database')));
    const statelessApp = createApp({
      logger: silentLogger,
      db: { ...db, ping },
      accountsEnabled: false,
    });

    const res = await request(statelessApp).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      database: 'not-used',
      uptimeSeconds: expect.any(Number) as number,
    });
    expect(ping).not.toHaveBeenCalled();
  });
});

describe('request handling', () => {
  it('returns a JSON 404 for unknown API routes', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: 'not_found', message: 'Resource not found.' } });
  });

  it('returns a JSON 404 for any other unknown path', async () => {
    const res = await request(app).get('/anything');

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('rejects malformed JSON with 400 and no stack trace', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"broken":');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: { code: 'bad_request', message: 'The request could not be understood.' },
    });
    expect(res.text).not.toMatch(/at .*\.(js|ts)/);
  });

  it('rejects oversized bodies with 413', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ blob: 'x'.repeat(200_000) }));

    expect(res.status).toBe(413);
    expect(res.body).toMatchObject({ error: { code: 'bad_request' } });
  });

  it('sets security headers and hides the framework', async () => {
    const res = await request(app).get('/api/health');

    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('tags each response with a unique request id', async () => {
    const [a, b] = await Promise.all([
      request(app).get('/api/health'),
      request(app).get('/api/health'),
    ]);

    expect(a.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(a.headers['x-request-id']).not.toBe(b.headers['x-request-id']);
  });
});
