import { describe, expect, it } from 'vitest';
import { CATEGORIES } from './categories';
import { buildRobotsTxt, buildSitemapXml, getIndexableRoutes } from './sitemap';
import { getToolsByCategory, TOOLS } from './tools';

describe('getIndexableRoutes', () => {
  const routes = getIndexableRoutes();
  const paths = routes.map((route) => route.path);

  it('includes the home page and All Tools', () => {
    expect(paths).toContain('/');
    expect(paths).toContain('/tools');
  });

  it('includes every populated category page', () => {
    for (const category of CATEGORIES) {
      const hasTools = getToolsByCategory(category.id).length > 0;
      expect(paths.includes(`/tools/${category.id}`)).toBe(hasTools);
    }
  });

  it('includes every tool exactly once, with no manual list to drift', () => {
    for (const tool of TOOLS) {
      expect(paths.filter((p) => p === `/tools/${tool.slug}`)).toHaveLength(1);
    }
  });

  it('lists every path once', () => {
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('excludes the empty "ai" category (no indexable content yet)', () => {
    expect(paths).not.toContain('/tools/ai');
  });

  it('has no duplicate URLs', () => {
    expect(new Set(paths).size).toBe(paths.length);
  });
});

describe('buildSitemapXml', () => {
  const xml = buildSitemapXml('https://toolora.example');

  it('is well-formed enough to contain matching urlset tags', () => {
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('</urlset>');
  });

  it('uses absolute URLs built from the given origin', () => {
    expect(xml).toContain('<loc>https://toolora.example/</loc>');
    expect(xml).toContain('<loc>https://toolora.example/tools</loc>');
    for (const tool of TOOLS) {
      expect(xml).toContain(`<loc>https://toolora.example/tools/${tool.slug}</loc>`);
    }
  });

  it('never includes a 404 or query/filter URL', () => {
    expect(xml).not.toContain('?q=');
    expect(xml).not.toContain('?category=');
    expect(xml.toLowerCase()).not.toContain('not-found');
  });
});

describe('buildRobotsTxt', () => {
  it('allows crawling everything', () => {
    expect(buildRobotsTxt(undefined)).toContain('Allow: /');
  });

  it('references the sitemap when an origin is configured', () => {
    expect(buildRobotsTxt('https://toolora.example')).toContain(
      'Sitemap: https://toolora.example/sitemap.xml',
    );
  });

  it('omits the Sitemap line when no origin is configured', () => {
    expect(buildRobotsTxt(undefined)).not.toContain('Sitemap:');
  });
});
