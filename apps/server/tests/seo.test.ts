import { absoluteUrl, getIndexableRoutes } from '@toolora/shared';
import request from 'supertest';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
import { createDatabase } from '../src/db';
import type { Logger } from '../src/logger';

const silentLogger: Logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const db = createDatabase(':memory:');

afterAll(async () => {
  await db.close();
});

describe('GET /robots.txt', () => {
  it('allows crawling and omits the Sitemap line without a configured origin', async () => {
    const app = createApp({ logger: silentLogger, db });
    const res = await request(app).get('/robots.txt');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toContain('Allow: /');
    expect(res.text).not.toContain('Sitemap:');
  });

  it('references the sitemap using the configured origin', async () => {
    const app = createApp({
      logger: silentLogger,
      db,
      publicSiteOrigin: 'https://toolora.example',
    });
    const res = await request(app).get('/robots.txt');

    expect(res.text).toContain('Sitemap: https://toolora.example/sitemap.xml');
  });
});

describe('GET /sitemap.xml', () => {
  it('returns 404 without a configured origin, rather than inventing a domain', async () => {
    const app = createApp({ logger: silentLogger, db });
    const res = await request(app).get('/sitemap.xml');

    expect(res.status).toBe(404);
  });

  it('serves every indexable route as an absolute URL once an origin is configured', async () => {
    const app = createApp({
      logger: silentLogger,
      db,
      publicSiteOrigin: 'https://toolora.example',
    });
    const res = await request(app).get('/sitemap.xml');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/xml/);
    for (const route of getIndexableRoutes()) {
      expect(res.text).toContain(
        `<loc>${absoluteUrl('https://toolora.example', route.path)}</loc>`,
      );
    }
  });
});
