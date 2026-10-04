import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getIndexableRoutes, TOOLS } from '@toolora/shared';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
import { createDatabase } from '../src/db';
import type { Logger } from '../src/logger';
import { escapeHtml, injectSeoHead, renderSeoHead } from '../src/seoHead';

const silentLogger: Logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const db = createDatabase(':memory:');
const ORIGIN = 'https://toolora.example';

const TEMPLATE =
  '<!doctype html><html><head><meta charset="UTF-8" />' +
  '<!--seo:start--><title>dev default</title><meta name="description" content="dev" /><!--seo:end-->' +
  '</head><body><div id="root"></div></body></html>';

let distDir: string;

beforeAll(() => {
  distDir = mkdtempSync(join(tmpdir(), 'toolora-dist-'));
  writeFileSync(join(distDir, 'index.html'), TEMPLATE);
  mkdirSync(join(distDir, 'assets'));
  writeFileSync(join(distDir, 'assets', 'app.js'), 'console.log(1);');
});

afterAll(async () => {
  rmSync(distDir, { recursive: true, force: true });
  await db.close();
});

const app = (origin: string | null = ORIGIN) =>
  createApp({
    logger: silentLogger,
    db,
    publicSiteOrigin: origin ?? undefined,
    webDistDir: distDir,
  });

/** Counts occurrences of a tag pattern in the HTML. */
const count = (html: string, pattern: RegExp) => (html.match(pattern) ?? []).length;

describe('server-rendered SEO head', () => {
  it('home: title, description, canonical, OG, Twitter, robots and WebSite JSON-LD', async () => {
    const res = await request(app()).get('/');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('<title>Toolora – Simple online tools for everyday tasks</title>');
    expect(res.text).toContain('<link rel="canonical" href="https://toolora.example/" />');
    expect(res.text).toContain('<meta name="robots" content="index,follow" />');
    expect(res.text).toContain('<meta property="og:url" content="https://toolora.example/" />');
    expect(res.text).toContain('<meta property="og:site_name" content="Toolora" />');
    expect(res.text).toContain('<meta property="og:type" content="website" />');
    expect(res.text).toContain('<meta name="twitter:card" content="summary" />');
    expect(res.text).toContain('"@type":"WebSite"');
    expect(res.text).not.toContain('dev default');
  });

  it('all tools: static metadata; query parameters never become the canonical', async () => {
    const res = await request(app()).get('/tools?q=%22%3E%3Cscript%3Ealert(1)%3C/script%3E');

    expect(res.status).toBe(200);
    expect(res.text).toContain('<title>All Tools — Toolora</title>');
    expect(res.text).toContain('<link rel="canonical" href="https://toolora.example/tools" />');
    expect(res.text).not.toContain('alert(1)');
  });

  it('all tools: a bare ?category= filter canonicalizes to that category page', async () => {
    const res = await request(app()).get('/tools?category=japan');
    expect(res.text).toContain(
      '<link rel="canonical" href="https://toolora.example/tools/japan" />',
    );
  });

  it('category: reflects the actual category and is indexable', async () => {
    const res = await request(app()).get('/tools/developer');

    expect(res.status).toBe(200);
    expect(res.text).toContain('<title>Developer Tools — Toolora</title>');
    expect(res.text).toContain(
      '<link rel="canonical" href="https://toolora.example/tools/developer" />',
    );
    expect(res.text).toContain('<meta name="robots" content="index,follow" />');
  });

  it('empty category (ai): 200 but noindex', async () => {
    const res = await request(app()).get('/tools/ai');

    expect(res.status).toBe(200);
    expect(res.text).toContain('<meta name="robots" content="noindex,follow" />');
  });

  it('account page: served as 200 but noindex, and absent from the sitemap', async () => {
    const res = await request(app()).get('/account');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<title>Account — Toolora</title>');
    expect(res.text).toContain('<meta name="robots" content="noindex,follow" />');
    expect((await request(app()).get('/sitemap.xml')).text).not.toContain('/account');
  });

  it('account page: a private page has no canonical or og:url of its own', async () => {
    const { text } = await request(app()).get('/account');
    expect(text).not.toContain('rel="canonical"');
    expect(text).not.toContain('property="og:url"');
  });

  it('does not serve the raw index.html template (it has no per-route tags)', async () => {
    const res = await request(app()).get('/index.html');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
  });

  it('every registered tool gets its registry title, description, canonical and JSON-LD', async () => {
    for (const tool of TOOLS) {
      const res = await request(app()).get(`/tools/${tool.slug}`);
      expect(res.status, tool.slug).toBe(200);
      expect(res.text).toContain(`<title>${escapeHtml(tool.seoTitle)}</title>`);
      expect(res.text).toContain(`content="${escapeHtml(tool.seoDescription)}"`);
      expect(res.text).toContain(`href="https://toolora.example/tools/${tool.slug}"`);
      expect(res.text).toContain('"@type":"WebApplication"');
    }
  });

  it('a Phase 7 tool (regex tester) is served from the registry', async () => {
    const tool = TOOLS.find((t) => t.id.includes('regex'))!;
    const res = await request(app()).get(`/tools/${tool.slug}`);
    expect(res.text).toContain(`<title>${escapeHtml(tool.seoTitle)}</title>`);
  });

  it('404: 404 status, noindex, no canonical, no og:url, no JSON-LD', async () => {
    for (const path of ['/does-not-exist', '/tools/not-a-tool', '/tools/%E0%A4%A']) {
      const res = await request(app()).get(path);
      expect(res.status, path).toBe(404);
      expect(res.text).toContain('<meta name="robots" content="noindex,follow" />');
      expect(res.text).toContain('<title>Page not found — Toolora</title>');
      expect(res.text).not.toContain('rel="canonical"');
      expect(res.text).not.toContain('og:url');
      expect(res.text).not.toContain('ld+json');
    }
  });

  it('without a public origin: relative canonical, no JSON-LD', async () => {
    const res = await request(app(null)).get('/tools/japanese-yen-converter');
    expect(res.text).toContain('<link rel="canonical" href="/tools/japanese-yen-converter" />');
    expect(res.text).not.toContain('ld+json');
  });

  it('emits exactly one of each head tag', async () => {
    const res = await request(app()).get('/tools/japanese-yen-converter');
    for (const pattern of [
      /<title>/g,
      /name="description"/g,
      /rel="canonical"/g,
      /name="robots"/g,
      /property="og:title"/g,
      /property="og:url"/g,
      /name="twitter:title"/g,
      /id="page-structured-data"/g,
    ]) {
      expect(count(res.text, pattern), String(pattern)).toBe(1);
    }
  });

  it('serves static assets, and a missing asset or API path is not an HTML page', async () => {
    expect((await request(app()).get('/assets/app.js')).status).toBe(200);
    const missing = await request(app()).get('/assets/nope.js');
    expect(missing.status).toBe(404);
    expect(missing.headers['content-type']).not.toMatch(/html/);
    const api = await request(app()).get('/api/nope');
    expect(api.status).toBe(404);
    expect(api.headers['content-type']).toMatch(/json/);
  });
});

describe('sitemap/robots consistency with the page routes', () => {
  it('every sitemap URL answers 200 and is indexable; empty categories and queries are absent', async () => {
    const sitemap = (await request(app()).get('/sitemap.xml')).text;
    expect(sitemap).not.toContain('/tools/ai<');
    expect(sitemap).not.toMatch(/<loc>[^<]*\?/);
    const locs = getIndexableRoutes().map((r) => r.path);
    expect(new Set(locs).size).toBe(locs.length);
    for (const path of locs) {
      const res = await request(app()).get(path);
      expect(res.status, path).toBe(200);
      expect(res.text, path).toContain('content="index,follow"');
    }
  });

  it('robots.txt points at the sitemap', async () => {
    const res = await request(app()).get('/robots.txt');
    expect(res.text).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
  });
});

describe('escaping', () => {
  it('escapes metadata in attributes and text', () => {
    const html = renderSeoHead(
      { title: '<b>"x"&\'', description: '"><script>alert(1)</script>', path: '/a"b' },
      undefined,
    );
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<b>');
    expect(html).toContain('&lt;b&gt;&quot;x&quot;&amp;&#39;');
    expect(html).toContain('href="/a&quot;b"');
  });

  it('keeps "</script>" inside JSON-LD from closing the tag', () => {
    const html = renderSeoHead(
      { title: 't', description: 'd', structuredData: { name: '</script><img src=x>' } },
      undefined,
    );
    expect(html.match(/<\/script>/g)).toHaveLength(1);
    expect(html).toContain('\\u003c/script>');
  });

  it('does not treat "$" in tags as a replacement pattern', () => {
    expect(injectSeoHead(TEMPLATE, "$& $1 $'")).toContain("$& $1 $'");
  });
});
