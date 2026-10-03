import type { PageMeta } from '@toolora/shared';
import { absoluteUrl, SITE_NAME } from '@toolora/shared';

const SEO_REGION = /<!--seo:start-->[\s\S]*?<!--seo:end-->/;

/** Escapes text for use in element content and double-quoted attribute values. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const meta = (attr: 'name' | 'property', key: string, content: string) =>
  `<meta ${attr}="${key}" content="${escapeHtml(content)}" />`;

/**
 * Renders the per-route head tags — the same set `useDocumentMeta` maintains client-side, so the
 * client's upserts find and update these elements instead of adding duplicates. `og:site_name` is
 * server-only (the client never touches it). The JSON-LD script carries the id the client looks up.
 */
export function renderSeoHead(page: PageMeta, origin: string | undefined): string {
  const canonical = page.path === undefined ? undefined : absoluteUrl(origin, page.path);
  const tags = [
    `<title>${escapeHtml(page.title)}</title>`,
    meta('name', 'description', page.description),
    meta('name', 'robots', page.robots ?? 'index,follow'),
    ...(canonical === undefined
      ? []
      : [`<link rel="canonical" href="${escapeHtml(canonical)}" />`]),
    meta('property', 'og:site_name', SITE_NAME),
    meta('property', 'og:type', page.ogType ?? 'website'),
    meta('property', 'og:title', page.title),
    meta('property', 'og:description', page.description),
    ...(canonical === undefined ? [] : [meta('property', 'og:url', canonical)]),
    meta('name', 'twitter:card', 'summary'),
    meta('name', 'twitter:title', page.title),
    meta('name', 'twitter:description', page.description),
  ];
  if (page.structuredData !== undefined) {
    // "<" escaped so a value containing "</script>" cannot end the tag.
    const json = JSON.stringify(page.structuredData).replace(/</g, '\\u003c');
    tags.push(`<script id="page-structured-data" type="application/ld+json">${json}</script>`);
  }
  return tags.join('\n    ');
}

/** Replaces the dev-default region of the built index.html with the route's tags. */
export function injectSeoHead(template: string, headHtml: string): string {
  // Function replacer: `$` sequences in the tags must not be read as replacement patterns.
  return template.replace(SEO_REGION, () => headHtml);
}

export function hasSeoRegion(template: string): boolean {
  return SEO_REGION.test(template);
}
