import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
import { createDatabase } from '../src/db';
import type { Logger } from '../src/logger';

const silentLogger: Logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const db = createDatabase(':memory:');
let distDir: string;
let app: ReturnType<typeof createApp>;

beforeAll(() => {
  distDir = mkdtempSync(join(tmpdir(), 'toolora-prod-'));
  writeFileSync(
    join(distDir, 'index.html'),
    '<!doctype html><html><head><!--seo:start--><!--seo:end--></head><body></body></html>',
  );
  writeFileSync(join(distDir, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  mkdirSync(join(distDir, 'assets'));
  writeFileSync(join(distDir, 'assets', 'index-abc123.js'), 'console.log(1);');
  // A secret next to the build output must never be reachable.
  writeFileSync(join(distDir, '.env'), 'SECRET=1');
  app = createApp({
    logger: silentLogger,
    db,
    publicSiteOrigin: 'https://toolora.example',
    webDistDir: distDir,
  });
});

afterAll(async () => {
  rmSync(distDir, { recursive: true, force: true });
  await db.close();
});

describe('security headers', () => {
  it.each(['/', '/api/health', '/assets/index-abc123.js', '/missing'])(
    'are set on %s',
    async (p) => {
      const { headers } = await request(app).get(p);
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['referrer-policy']).toBeDefined();
      expect(headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(headers['permissions-policy']).toContain('camera=()');
      expect(headers['content-security-policy']).toContain("script-src 'self'");
      expect(headers['content-security-policy']).toContain("object-src 'none'");
    },
  );
});

describe('CORS', () => {
  it('is same-origin only: no CORS headers, even for a cross-origin request or preflight', async () => {
    const get = await request(app).get('/api/health').set('Origin', 'https://evil.example');
    expect(get.headers['access-control-allow-origin']).toBeUndefined();
    const preflight = await request(app)
      .options('/api/health')
      .set('Origin', 'https://evil.example')
      .set('Access-Control-Request-Method', 'POST');
    expect(preflight.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('caching', () => {
  it('fingerprinted assets are immutable for a year', async () => {
    const res = await request(app).get('/assets/index-abc123.js');
    expect(res.headers['cache-control']).toBe('public, max-age=31536000, immutable');
  });

  it('HTML (including 404 shells) is revalidated, never cached blindly', async () => {
    for (const p of ['/', '/tools', '/does-not-exist']) {
      const res = await request(app).get(p);
      expect(res.headers['cache-control'], p).toBe('no-cache');
    }
  });

  it('unhashed files revalidate and API responses are not stored', async () => {
    const icon = await request(app).get('/favicon.svg');
    expect(icon.headers['cache-control']).toBe('public, max-age=0');
    expect((await request(app).get('/api/health')).headers['cache-control']).toBe('no-store');
    expect((await request(app).get('/api/nope')).headers['cache-control']).toBe('no-store');
  });
});

describe('files that must not be served', () => {
  it.each([
    '/.env',
    '/.git/config',
    '/package.json',
    '/apps/server/src/index.ts',
    '/prisma/dev.db',
    '/../package.json',
    '/%2e%2e/package.json',
    '/assets/../../package.json',
  ])('%s leaks nothing', async (p) => {
    const res = await request(app).get(p);
    expect(res.status).toBe(404);
    expect(res.text).not.toContain('SECRET=1');
    expect(res.text).not.toContain('"workspaces"');
  });

  it('unknown asset-like paths are JSON 404s, not the SPA shell', async () => {
    for (const p of ['/nonexistent.js', '/nonexistent.css']) {
      const res = await request(app).get(p);
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toMatch(/json/);
    }
  });

  it('/api never falls back to HTML', async () => {
    for (const p of ['/api', '/api/', '/api/anything/deep']) {
      const res = await request(app).get(p);
      expect(res.status, p).toBe(404);
      expect(res.headers['content-type'], p).toMatch(/json/);
    }
  });
});
