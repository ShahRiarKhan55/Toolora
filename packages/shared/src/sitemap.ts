// Sitemap and robots.txt generation (Phase 5), derived entirely from the tool registry and category
// list so there is no second, hand-maintained URL list to drift out of sync (see CLAUDE.md, "Rules
// against fake functionality" and docs/tools.md).

import { CONTACT_ROUTE, HOME_ROUTE, PRIVACY_ROUTE } from './site';
import { ALL_TOOLS_ROUTE, categoryRoute, getPopulatedCategories, TOOLS, toolRoute } from './tools';
import { absoluteUrl } from './url';

export interface SitemapRoute {
  path: string;
}

/**
 * Every route that should be indexed: home, "All Tools", the privacy and contact pages, every category page that actually has a
 * tool in it, and every tool page. A category with no tools yet (currently `ai`) is deliberately left
 * out — it has no indexable content, just a "coming soon" empty state (see `docs/tools.md`).
 */
export function getIndexableRoutes(): readonly SitemapRoute[] {
  const categoryRoutes = getPopulatedCategories().map((category) => ({
    path: categoryRoute(category.id),
  }));
  const toolRoutes = TOOLS.map((tool) => ({ path: toolRoute(tool.slug) }));

  return [
    { path: HOME_ROUTE },
    { path: ALL_TOOLS_ROUTE },
    ...categoryRoutes,
    ...toolRoutes,
    { path: PRIVACY_ROUTE },
    { path: CONTACT_ROUTE },
  ];
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Builds `sitemap.xml`. The sitemap protocol requires absolute URLs, so this only makes sense once a
 * public origin is configured — callers should not serve this without one (see `apps/server/src/routes/seo.ts`).
 */
export function buildSitemapXml(origin: string): string {
  const entries = getIndexableRoutes()
    .map(
      (route) => `  <url>\n    <loc>${escapeXml(absoluteUrl(origin, route.path))}</loc>\n  </url>`,
    )
    .join('\n');

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `${entries}\n` +
    '</urlset>\n'
  );
}

/**
 * Builds `robots.txt`. Every real page is crawlable — search/filter query variants are handled with
 * canonical tags, not a robots disallow (see `apps/web/src/lib/useDocumentMeta.ts`), and no CSS/JS
 * asset path is blocked. The `Sitemap:` line is only included once a public origin is configured,
 * since a sitemap needs absolute URLs and none is served without one.
 */
export function buildRobotsTxt(origin: string | undefined): string {
  const lines = ['User-agent: *', 'Allow: /'];
  if (origin !== undefined) {
    lines.push('', `Sitemap: ${absoluteUrl(origin, '/sitemap.xml')}`);
  }
  return `${lines.join('\n')}\n`;
}
